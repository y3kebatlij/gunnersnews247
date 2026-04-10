import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigatewayv2Integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as ses from "aws-cdk-lib/aws-ses";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class ArsenalNewsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========== DynamoDB Tables ==========

    const contentItemsTable = new dynamodb.Table(this, "ContentItems", {
      tableName: "ContentItems",
      partitionKey: { name: "contentId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "aggregationDate", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    contentItemsTable.addGlobalSecondaryIndex({
      indexName: "ContentByDate",
      partitionKey: { name: "aggregationDate", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "contentType", type: dynamodb.AttributeType.STRING },
    });

    // Note: DynamoDB GSI partition key must be string/number, not boolean.
    // We store isTransfer as string "true"/"false" for the GSI.
    contentItemsTable.addGlobalSecondaryIndex({
      indexName: "TransferItems",
      partitionKey: { name: "isTransfer", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "publicationDate", type: dynamodb.AttributeType.STRING },
    });

    const subscribersTable = new dynamodb.Table(this, "Subscribers", {
      tableName: "Subscribers",
      partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const sourceRegistryTable = new dynamodb.Table(this, "SourceRegistry", {
      tableName: "SourceRegistry",
      partitionKey: { name: "sourceId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const matchesTable = new dynamodb.Table(this, "Matches", {
      tableName: "Matches",
      partitionKey: { name: "matchId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "matchDate", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    matchesTable.addGlobalSecondaryIndex({
      indexName: "UpcomingMatches",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "kickoffTime", type: dynamodb.AttributeType.STRING },
    });

    const matchEventsTable = new dynamodb.Table(this, "MatchEvents", {
      tableName: "MatchEvents",
      partitionKey: { name: "matchId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "eventId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const lineupsTable = new dynamodb.Table(this, "Lineups", {
      tableName: "Lineups",
      partitionKey: { name: "matchId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "teamSide", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const standingsTable = new dynamodb.Table(this, "Standings", {
      tableName: "Standings",
      partitionKey: { name: "competition", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "position", type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const connectionsTable = new dynamodb.Table(this, "WebSocketConnections", {
      tableName: "WebSocketConnections",
      partitionKey: { name: "connectionId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: "ttl",
    });

    // ========== Shared Lambda Environment ==========

    const sharedEnv: Record<string, string> = {
      DYNAMODB_CONTENT_ITEMS_TABLE: contentItemsTable.tableName,
      DYNAMODB_SUBSCRIBERS_TABLE: subscribersTable.tableName,
      DYNAMODB_SOURCE_REGISTRY_TABLE: sourceRegistryTable.tableName,
      DYNAMODB_MATCHES_TABLE: matchesTable.tableName,
      DYNAMODB_MATCH_EVENTS_TABLE: matchEventsTable.tableName,
      DYNAMODB_LINEUPS_TABLE: lineupsTable.tableName,
      DYNAMODB_STANDINGS_TABLE: standingsTable.tableName,
      DYNAMODB_WEBSOCKET_CONNECTIONS_TABLE: connectionsTable.tableName,
      SES_SENDER_EMAIL: process.env.SES_SENDER_EMAIL ?? "noreply@example.com",
      FOOTBALL_DATA_API_KEY: process.env.FOOTBALL_DATA_API_KEY ?? "",
    };

    const lambdaDefaults = {
      runtime: lambda.Runtime.NODEJS_22_X,
      memorySize: 256,
      timeout: cdk.Duration.minutes(5),
      environment: sharedEnv,
    };

    // ========== Lambda Functions ==========

    const aggregatorFn = new lambda.Function(this, "AggregatorHandler", {
      ...lambdaDefaults,
      functionName: "arsenal-aggregator",
      handler: "aggregator/handler.handler",
      code: lambda.Code.fromAsset("packages/backend/dist"),
      timeout: cdk.Duration.minutes(5),
    });

    const digestFn = new lambda.Function(this, "DigestHandler", {
      ...lambdaDefaults,
      functionName: "arsenal-digest",
      handler: "digest/handler.handler",
      code: lambda.Code.fromAsset("packages/backend/dist"),
      timeout: cdk.Duration.minutes(2),
    });

    const matchFn = new lambda.Function(this, "MatchHandler", {
      ...lambdaDefaults,
      functionName: "arsenal-match",
      handler: "match/handler.handler",
      code: lambda.Code.fromAsset("packages/backend/dist"),
      timeout: cdk.Duration.minutes(1),
    });

    const realtimeFn = new lambda.Function(this, "RealtimeHandler", {
      ...lambdaDefaults,
      functionName: "arsenal-realtime",
      handler: "realtime/handler.handler",
      code: lambda.Code.fromAsset("packages/backend/dist"),
      timeout: cdk.Duration.seconds(30),
    });

    const apiFn = new lambda.Function(this, "ApiHandler", {
      ...lambdaDefaults,
      functionName: "arsenal-api",
      handler: "api/handler.handler",
      code: lambda.Code.fromAsset("packages/backend/dist"),
      timeout: cdk.Duration.seconds(30),
    });

    // ========== DynamoDB Permissions ==========

    const allTables = [
      contentItemsTable, subscribersTable, sourceRegistryTable,
      matchesTable, matchEventsTable, lineupsTable, standingsTable, connectionsTable,
    ];

    for (const table of allTables) {
      table.grantReadWriteData(aggregatorFn);
      table.grantReadWriteData(digestFn);
      table.grantReadWriteData(matchFn);
      table.grantReadWriteData(realtimeFn);
      table.grantReadData(apiFn);
    }
    // API also needs write for subscribe/unsubscribe
    subscribersTable.grantReadWriteData(apiFn);

    // ========== SES Permissions ==========

    digestFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: ["*"],
      })
    );

    // ========== REST API Gateway ==========

    const restApi = new apigateway.LambdaRestApi(this, "ArsenalApi", {
      restApiName: "Arsenal News API",
      handler: apiFn,
      proxy: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // ========== WebSocket API Gateway ==========

    const wsApi = new apigatewayv2.WebSocketApi(this, "ArsenalWebSocket", {
      apiName: "Arsenal News WebSocket",
      connectRouteOptions: {
        integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
          "ConnectIntegration",
          realtimeFn
        ),
      },
      disconnectRouteOptions: {
        integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
          "DisconnectIntegration",
          realtimeFn
        ),
      },
    });

    const wsStage = new apigatewayv2.WebSocketStage(this, "ArsenalWebSocketStage", {
      webSocketApi: wsApi,
      stageName: "prod",
      autoDeploy: true,
    });

    // Grant realtime Lambda permission to manage WebSocket connections
    realtimeFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["execute-api:ManageConnections"],
        resources: [
          `arn:aws:execute-api:${this.region}:${this.account}:${wsApi.apiId}/${wsStage.stageName}/POST/@connections/*`,
        ],
      })
    );

    // Pass WebSocket URL to realtime Lambda
    realtimeFn.addEnvironment(
      "WEBSOCKET_API_URL",
      `wss://${wsApi.apiId}.execute-api.${this.region}.amazonaws.com/${wsStage.stageName}`
    );

    // ========== S3 + CloudFront (Frontend) ==========

    const siteBucket = new s3.Bucket(this, "FrontendBucket", {
      bucketName: `arsenal-news-frontend-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, "FrontendDistribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html", // SPA routing
        },
      ],
    });

    new s3deploy.BucketDeployment(this, "DeployFrontend", {
      sources: [s3deploy.Source.asset("packages/frontend/dist")],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    // ========== EventBridge Schedules ==========

    // Daily aggregation at 08:00 EST (13:00 UTC)
    new events.Rule(this, "AggregatorSchedule", {
      ruleName: "arsenal-aggregator-daily",
      schedule: events.Schedule.cron({ minute: "0", hour: "13" }),
      targets: [new targets.LambdaFunction(aggregatorFn)],
    });

    // Daily digest at 09:00 EST (14:00 UTC)
    new events.Rule(this, "DigestSchedule", {
      ruleName: "arsenal-digest-daily",
      schedule: events.Schedule.cron({ minute: "0", hour: "14" }),
      targets: [new targets.LambdaFunction(digestFn)],
    });

    // Match data polling every 1 minute
    new events.Rule(this, "MatchPollingSchedule", {
      ruleName: "arsenal-match-polling",
      schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
      targets: [new targets.LambdaFunction(matchFn)],
      enabled: false, // Enable manually during match windows
    });

    // ========== Outputs ==========

    new cdk.CfnOutput(this, "ApiUrl", {
      value: restApi.url,
      description: "REST API Gateway URL",
    });

    new cdk.CfnOutput(this, "WebSocketUrl", {
      value: `wss://${wsApi.apiId}.execute-api.${this.region}.amazonaws.com/${wsStage.stageName}`,
      description: "WebSocket API URL",
    });

    new cdk.CfnOutput(this, "CloudFrontUrl", {
      value: `https://${distribution.distributionDomainName}`,
      description: "Frontend CloudFront URL",
    });

    new cdk.CfnOutput(this, "FrontendBucketName", {
      value: siteBucket.bucketName,
      description: "S3 bucket for frontend assets",
    });
  }
}
