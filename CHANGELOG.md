# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0]

The initial release of the extension.

### Added

- Control plane
  - Save and load control plane configurations
  - List control plane tenants/applications
  - API client
- Tenant
  - Create and delete tenants
  - List tenant applications
  - Initialize application manifests
- Application
  - List application components (modules/pipelines/agents)
  - Delete application
  - Get application details
  - Watch application logs
  - Message with gateways
- Gateway
  - List gateways
- Pipeline
  - Code lens shows a deploy and update button
- Agent
  - Snippet completion while building a pipeline

Contributors: ddieruf
