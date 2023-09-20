# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1]

### Fixed
- Logs stream socket connection was not being closed when the logs view was closed
- Cleaned up gateway connection management

### Changed
- The log stream connection is now managed by the logs view, instead of the gateway messenger. When the stream is closed the event viewer is removed from window which is much easier on the eyes.
- The environment tree new displays the CompositeAgents for a pipeline, instead of individual agents
- Added links to the project home page in the READMEs

Contributors: ddieruf

## [0.3.0]

This version is a significant step forward for the extension. There a quite a few changes. It was tested using LangStream version 0.0.16.

### Changed

Control plane
- Not relying on the models provided by the control plane swagger as much

Logs
- Moved logging to individual agents

Gateway Messaging
- Moved create record to a modal
- Record listing layout less of a chat style and more of a list
- Managing producer and consumer socket connections separately
- Gave the messaging between the webview and the extension more (type) definition

### Added

Logs
- View agent (filtered) logs
- Search log messages
- Filter by log level

Gateway
- Create record modal
- Option to include key and headers when creating a new record
- Created the idea of a messenger to manage socket connections

Contributors: ddieruf

## [0.2.1]

### Changed

For pipeline and agent, created a decision hierarchy to display either its name, id, or "unknown" 

Contributors: ddieruf

## [0.2.0]

### Added

Project logo everywhere

Contributors: ddieruf

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
