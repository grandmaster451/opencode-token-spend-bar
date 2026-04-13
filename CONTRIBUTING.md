# Contributing to OpenCode Token Spend Bar

First off, thank you for considering contributing! It's people like you that make this plugin better for everyone.

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check the existing issues to see if the problem has already been reported.

When creating a bug report, please include as many details as possible:

- **Plugin version**
- **OpenCode version**
- **Operating system**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** (if applicable)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Please provide:

- Clear description of the enhancement
- Use case / why it would be useful
- Possible implementation approach (if you have ideas)

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run the test suite (`npm test`)
5. Ensure build passes (`npm run build`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/opencode-token-spend-bar.git
cd opencode-token-spend-bar

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run QA
npm run qa:full
```

## Code Style

- Use TypeScript strictly (no `any` types)
- Follow existing code patterns
- Add tests for new functionality
- Keep functions small and focused
- Use meaningful variable names

## Testing

All PRs must:

- Pass all existing tests
- Include tests for new functionality
- Maintain or improve code coverage

Run tests before submitting:

```bash
npm test
```

## Commit Messages

Use clear and meaningful commit messages:

- `feat: add new feature`
- `fix: resolve bug in widget`
- `docs: update README`
- `test: add tests for X`
- `refactor: improve Y`

## Questions?

Feel free to open an issue with your question or join our discussions!

## Code of Conduct

Be respectful and constructive in all interactions.

Thank you for contributing! 🎉