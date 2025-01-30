
# Passkey Project

## [Demo](https://passkey-demo.espaciofuturo.io)

<div align="center">
  <img src="https://github.com/espaciofuturoio/passkey/blob/main/assets/passkey-demo.gif" alt="Passkey Demostration">
</div>

## Overview

The Passkey project is a web application that implements WebAuthn for secure user authentication. It leverages the `@simplewebauthn` library to handle registration and authentication processes, using Redis for data storage.

## Features

- User registration and authentication using WebAuthn.
- Secure storage of user credentials.
- Mock Redis for local development.

## Prerequisites

- Bun.js or Node.js (version 20 or higher)
- Redis (for production use)

## Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/passkey.git
   cd passkey
   ```

2. **Install dependencies:**

   ```bash
   bun i
   ```

3. **Environment Configuration:**

   Create a `.env` file in the root directory and configure the following variables:

   ```plaintext
    PORT=3000
    ENV=development
    REDIS_URL=''
    RP_ID='["localhost"]'
    RP_NAME='["App"]'
    EXPECTED_ORIGIN='["http://localhost:3000"]'
    CHALLENGE_TTL_SECONDS=60

   ```

4. **Run the application:**

   For development:

   ```bash
   bun run dev
   ```

## Usage

### API Endpoints

- **Generate Registration Options:**

  `POST /api/generate-registration-options`

  - Request Body: `{ "identifier": "user@example.com" }`
  - Response: WebAuthn registration options.

- **Verify Registration:**

  `POST /api/verify-registration`

  - Request Body: `{ "identifier": "user@example.com", "registrationResponse": {...} }`
  - Response: Verification result.

- **Generate Authentication Options:**

  `POST /api/generate-authentication-options`

  - Request Body: `{ "identifier": "user@example.com" }`
  - Response: WebAuthn authentication options.

- **Verify Authentication:**

  `POST /api/verify-authentication`

  - Request Body: `{ "identifier": "user@example.com", "authenticationResponse": {...} }`
  - Response: Verification result.

### Custom Hooks

#### `usePasskeyAuthentication`

This hook manages the authentication process using WebAuthn.

- **Parameters:**
  - `identifier`: A string representing the user's identifier.

- **Returns:**
  - `isAuthenticating`: Boolean indicating if authentication is in progress.
  - `authSuccess`: String message on successful authentication.
  - `authError`: String message on authentication error.
  - `handleAuth`: Function to initiate the authentication process.
  - `isAuthenticated`: Boolean indicating if the user is authenticated.

#### `usePasskeyRegistration`

This hook manages the registration process using WebAuthn.

- **Parameters:**
  - `identifier`: A string representing the user's identifier.

- **Returns:**
  - `isCreatingPasskey`: Boolean indicating if registration is in progress.
  - `regSuccess`: String message on successful registration.
  - `regError`: String message on registration error.
  - `handleRegister`: Function to initiate the registration process.
  - `isRegistered`: Boolean indicating if the user is registered.

## Code Structure

- **`package.json`:** Lists project dependencies and scripts.
- **`src/app/libs/passkey.ts`:** Handles WebAuthn registration and authentication logic.
- **`src/app/libs/env.ts`:** Manages environment variables using Zod for validation.
- **`src/app/libs/redis.ts`:** Provides functions to interact with Redis for storing challenges and user data.
- **`src/hooks/usePasskeyAuthentication.ts`:** Custom hook for handling user authentication.
- **`src/hooks/usePasskeyRegistration.ts`:** Custom hook for handling user registration.
- **`src/app/api`:** Contains API routes for handling registration and authentication requests.

## References

- [WebAuthn Documentation](https://webauthn.guide/)
- [SimpleWebAuthn](https://simplewebauthn.dev/)
- [Passkeys Guide](https://www.passkeys.com/guide)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.
