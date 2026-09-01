# Test Automation PoC – deTesters Case

## Overview

This repository contains my Proof of Concept for the deTesters Test Automation Case.

The goal of this PoC was not to automate as many test cases as possible within the available time. Instead, I focused on understanding the application architecture, identifying the main risks, exploring the application behaviour, and implementing a small but maintainable set of representative automated tests.

The solution combines API and UI automation using Playwright and TypeScript.

---

## Technology

The main technologies used for the test automation solution are:

- Playwright
- TypeScript
- Node.js
- Docker / Docker Compose
- Git

### Why Playwright and TypeScript?

I deliberately selected Playwright with TypeScript because it allows both API and browser testing within the same framework.

For this PoC this provides several advantages:

- API and UI tests can be implemented using one test framework
- built-in auto-waiting for browser interactions
- good support for modern web applications
- built-in assertions, tracing and HTML reporting
- easy parallel execution
- strong TypeScript support
- straightforward integration with CI/CD pipelines

The intention was to keep the solution lightweight while still providing a good foundation for future extension.

---

## Approach

Before starting the automation implementation, I first explored the application and its architecture.

My approach was:

1. Start and verify the Docker environment
2. Understand the services and communication between them
3. Explore the application manually
4. Inspect network requests and API behaviour
5. Identify risks, defects and technical limitations
6. Decide which scenarios provide most value at API level
7. Select UI scenarios where browser interaction adds value
8. Implement a small representative automated test suite

This prevented me from immediately automating everything through the UI without first understanding the system under test.

---

## Application Architecture

During the technical discovery I identified the following architecture:

```text
Browser
   |
   v
Frontend :80
   |
   v
Proxy :8080
   |
   +-------------------+
   |                   |
   v                   v
Users :4242        Movies :4243
   |                   |
   v                   v
PostgreSQL :5432   MongoDB :27017
```

There is also a Data Seeder service responsible for initializing application data.

The Proxy acts as the entry point for backend requests from the frontend.

Understanding this architecture influenced the test strategy because not every scenario needs to be tested through the browser.

---

## Test Strategy

I intentionally use different test levels depending on what is being validated.

### API Testing

Business and service behaviour is tested directly through the API where browser interaction does not provide additional value.

This provides:

- faster execution
- easier failure diagnosis
- less dependency on UI implementation details
- more focused service validation

Implemented API scenarios:

- Retrieve movies successfully
- Validate the basic Movies API response contract
- Create a new user
- Reject creation of a duplicate username

### UI Testing

UI automation is used for behaviour that should be validated from the user's perspective.

Implemented UI scenario:

- Successful user registration through the Sign Up page

The UI test also verifies the relevant backend response before validating the resulting page.

---

## Automated Test Coverage

Current test structure:

```text
tests/
├── api/
│   ├── movies.spec.ts
│   └── users.spec.ts
└── ui/
    └── signup.spec.ts
```

The current PoC contains four automated tests.

### Movies API

The Movies API test validates:

- HTTP 200 response
- response is an array
- movie list is not empty
- representative movie objects contain the expected core fields and data types

The test deliberately does not validate an exact number of movies or a specific first movie because this would create unnecessary dependency on the current database content and ordering.

### Users API

The Users API tests validate:

- successful creation of a new user
- rejection of a duplicate username
- expected response information

### Sign Up UI

The UI test validates the successful registration flow from the user's perspective.

It fills in the registration form, submits the request, verifies the Users API response and validates that the user reaches the expected success page.

---

## Test Data Strategy

Tests should be repeatable and should not depend on manually created users already existing in the database.

Therefore usernames are generated dynamically.

Example:

```typescript
const username = `testuser${Date.now()}`;
```

This prevents collisions between test executions and allows the tests to be executed repeatedly.

For a larger test suite I would move test-data generation into reusable fixtures or dedicated test-data utilities and introduce appropriate cleanup mechanisms.

---

## Environment Discovery

While setting up the provided Docker environment, the Movies service initially failed during startup.

The investigation showed compatibility problems between the Python runtime and the legacy dependency stack used by the Movies service.

One of the initial errors was:

```text
TypeError: required field "type_ignores" missing from Module
```

A second compatibility issue was encountered involving the legacy PyMongo dependency.

The environment was adjusted to use a runtime/dependency combination compatible with the provided legacy application.

I intentionally kept these changes minimal because the purpose of the exercise is testing the provided application rather than modernising its implementation.

This was also an important part of the testing process: before implementing automated tests, I verified that the test environment and the individual services were actually healthy.

---

## Defects and Observations

During exploratory testing I identified the following issues.

### DEF-01 – Incorrect error page after duplicate registration

When attempting to register an existing username, the backend correctly rejects the request with HTTP 400 and returns an error indicating that the user already exists.

However, the frontend redirects the user to:

```text
/login-failed
```

and displays:

```text
Login Failed
```

This is misleading because the action performed by the user was registration, not login.

**Expected behaviour**

The user should receive a registration-specific message explaining that the username already exists.

**Actual behaviour**

The user is shown a login failure page.

**Impact**

The backend validation works correctly, but the frontend provides incorrect context to the user.

---

### DEF-02 – Login fails during access-token generation

During manual login testing, valid user credentials were successfully validated by the Users service.

However, the subsequent token creation request fails:

```text
POST /v1/proxy/tokens/
```

Response:

```text
500 Internal Server Error
```

Investigation of the Proxy logs showed the following exception during JWT access-token generation:

```text
AttributeError: 'str' object has no attribute 'decode'
```

This means the authentication flow fails after successful credential validation.

**Expected behaviour**

A user with valid credentials should receive an access token and successfully log in.

**Actual behaviour**

Credential validation succeeds, but token generation fails with HTTP 500.

**Impact**

High. Authenticated user flows are currently blocked.

I deliberately chose not to modify the authentication implementation purely to make an automated login test pass. Instead, I documented the issue as a known defect and limited the PoC to functionality that can currently be tested reliably.

---

### OBS-01 – User creation HTTP status

Successful user creation currently returns:

```text
HTTP 200 OK
```

From a REST API design perspective, `201 Created` could be considered more appropriate for successful resource creation.

However, because no explicit API contract was provided requiring HTTP 201, I treat this as an observation rather than a failing test.

---

## Running the Tests

### Prerequisites

The application should first be running through Docker Compose.

Verify that the required services are available before executing the tests.

Install the test dependencies:

```bash
npm install
```

Install the Playwright browsers:

```bash
npx playwright install
```

Run the current PoC using Chromium:

```bash
npx playwright test --project=chromium
```

The current test suite should execute four tests.

To view the Playwright HTML report:

```bash
npx playwright show-report
```

---

## Current Result

At the time of delivery the complete PoC executes successfully:

```text
Running 4 tests using 4 workers

4 passed
```

---

## Scope and Trade-offs

The available implementation time for this Proof of Concept was intentionally limited.

I therefore focused on demonstrating the testing approach rather than maximizing the number of automated tests.

The current solution demonstrates:

- API-level functional testing
- basic API contract validation
- positive and negative API scenarios
- dynamic test-data generation
- UI automation
- API/UI interaction
- exploratory testing
- technical investigation of service failures
- defect identification
- appropriate selection of test levels

Authentication-related automated flows were not expanded because token generation currently fails with HTTP 500.

Rather than changing the application simply to obtain a green automated test, I documented this as a known defect.

---

## Further Improvements

Given more time, I would extend the solution with:

- reusable Page Objects as UI coverage grows
- centralized configuration for API and UI base URLs
- reusable API fixtures
- dedicated test-data builders
- test-data cleanup
- additional negative and boundary scenarios
- authentication tests after the JWT issue is resolved
- API schema/contract validation
- improved test tagging
- CI/CD execution
- failure tracing and reporting
- environment health checks before test execution
- further risk-based coverage based on business requirements

I would introduce these abstractions when the test suite grows rather than adding unnecessary framework complexity to a small PoC.

---

## Design Principle

The main principle behind this PoC is:

> Automate at the lowest appropriate test level and use UI automation where browser behaviour provides additional value.

The objective is not simply to create more automated tests, but to create tests that are fast, understandable, maintainable and useful when diagnosing failures.