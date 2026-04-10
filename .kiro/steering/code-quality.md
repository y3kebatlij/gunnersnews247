---
inclusion: always
---

# Code Quality Standards

All code produced in this workspace must follow these principles. These are not suggestions — they are the baseline for quality.

## SOLID Principles

- **Single Responsibility:** Every module, class, or function does one thing. If you can't describe what it does in one sentence without "and," split it.
- **Open/Closed:** Code should be open for extension, closed for modification. Use interfaces, composition, and strategy patterns instead of modifying existing code.
- **Liskov Substitution:** Subtypes must be substitutable for their base types without breaking behavior. If you override a method, honor the contract.
- **Interface Segregation:** Don't force consumers to depend on methods they don't use. Prefer small, focused interfaces over large ones.
- **Dependency Inversion:** Depend on abstractions, not concretions. High-level modules should not import from low-level modules directly — use interfaces or dependency injection.

## Clean Code Patterns

- Use meaningful, descriptive names. No single-letter variables outside of loop counters or lambdas.
- Functions should be short and do one thing. If a function exceeds ~20 lines, consider breaking it up.
- Avoid deep nesting. Use early returns, guard clauses, and extraction to keep code flat.
- Don't repeat yourself (DRY), but don't over-abstract either. Duplication is cheaper than the wrong abstraction.
- Comments explain *why*, not *what*. If you need a comment to explain what code does, the code should be rewritten to be self-explanatory.
- No magic numbers or strings. Use named constants.
- Handle errors explicitly. Never swallow exceptions silently.
- Keep files focused. One component, one module, one concern per file.

## Rob Pike's 5 Rules of Programming

1. **You can't tell where a program is going to spend its time.** Don't guess at performance bottlenecks — measure first, optimize second.
2. **Measure.** Don't tune for speed until you've measured and confirmed there's a problem.
3. **Fancy algorithms are slow when n is small** — and n is usually small. Keep it simple until profiling proves otherwise.
4. **Fancy algorithms are buggier than simple ones.** Use simple algorithms and simple data structures until you have evidence you need otherwise.
5. **Data dominates.** If you've chosen the right data structures, the algorithms will be obvious. Write code around your data, not the other way around.

## General Practices

- Write small, testable units. If something is hard to test, it's probably doing too much.
- Prefer composition over inheritance.
- Keep public APIs minimal. Expose only what consumers need.
- Use consistent formatting. Let your linter/formatter handle style — don't argue about tabs vs spaces.
- Every function and module should have a clear owner and purpose.
