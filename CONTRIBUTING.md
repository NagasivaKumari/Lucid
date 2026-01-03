# Contributing to DropPay (UMIS)

Thank you for contributing! This project is maintained by the AlgoGit Squad. These guidelines explain how to contribute, run checks locally, and create quality pull requests.

## How to contribute

- Fork the repository and create a feature branch: `git checkout -b feat/your-feature`.
- Keep changes small and focused; one logical change per PR.
- Write clear commit messages and PR descriptions.

## Code style

- Python: follow PEP8. Use type hints where helpful.
- JavaScript: use modern ES syntax. Keep UI changes isolated.
- Smart contracts: write clear PyTeal code with explicit asserts and comments; include unit tests or local simulation scripts where feasible.

## Running checks locally

1. Install project dependencies:

```powershell
pip install -r requirements.txt
npm install
```

2. Compile PyTeal to TEAL to ensure contracts compile:

```powershell
python scripts/compile.py
```

3. Optionally run linters (install flake8):

```powershell
pip install flake8
flake8 contracts scripts
```

4. For frontend work, run your dev server or build step if configured.

## Pull Request process

- Target branch: `main`.
- Use feature branches named `feat/...` or `fix/...`.
- Add a clear description and link any issue.
- Assign reviewers from the `AlgoGit Squad` team.
- CI will run on each push/PR and must pass before merging.

## Security

- Never commit secrets or private keys.
- Use environment variables and GitHub Secrets for API keys and mnemonics.

## Code of Conduct

Be respectful and helpful. See `CODE_OF_CONDUCT.md` if present.