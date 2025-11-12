# Contributing to WhatsApp Web Integration

First off, thank you for considering contributing to WhatsApp Web Integration! 🎉

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Include your environment details** (OS, Node version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any similar features in other applications**

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

#### Pull Request Guidelines

- Follow the existing code style
- Write clear commit messages
- Update documentation as needed
- Add tests for new features
- Ensure all tests pass
- Keep pull requests focused on a single feature/fix

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/whatsapp-web-integration.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your test credentials

# Run tests
npm test

# Start development server
npm run dev
```

## Coding Conventions

- Use ES6+ features
- Follow the existing code style
- Use meaningful variable and function names
- Comment complex logic
- Keep functions small and focused
- Write tests for new features

## Testing

```bash
# Run all tests
npm test

# Run Supabase connection test
npm run test:supabase

# Run with coverage
npm test -- --coverage
```

## Documentation

- Update README.md if you change functionality
- Update QUICK_START.md for setup changes
- Update SUPABASE_SETUP.md for database changes
- Add JSDoc comments to functions
- Update API documentation for endpoint changes

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue with the `question` label if you have any questions.

Thank you for contributing! ❤️
