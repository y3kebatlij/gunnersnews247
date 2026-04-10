#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ArsenalNewsStack } from "./arsenal-news-stack";

const app = new cdk.App();

new ArsenalNewsStack(app, "ArsenalNewsAggregator", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
  },
  description: "Arsenal News Aggregator — serverless news platform",
});
