# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Placeholder for upcoming changes.

---

## [0.1.0] - 2026-07-12

### Added

#### Core

- Initial Runtime implementation
- Generic Runtime architecture
- Runtime destruction lifecycle (`destroy()`)
- Runtime state protection after destruction
- Plugin lifecycle management
- Generic `PluginManager`
- Generic `PluginContext`
- Generic `InsightPlugin`
- Generic `definePlugin()`
- EventBus implementation
- Subscription implementation
- SubscriptionRegistry implementation

#### Built-in Plugins

- Logger Plugin
- Logger Plugin factory API

#### Playground

- Playground package
- Workspace integration
- Public API validation
- Initial integration demo

#### Quality

- Runtime integration tests
- EventBus unit tests
- Subscription unit tests
- SubscriptionRegistry unit tests
- PluginManager unit tests
- Logger Plugin integration tests
- Shared ESLint Flat Config
- TypeScript strict configuration
- Coverage thresholds
- GitHub Actions CI
- Automated Quality Gate

#### Documentation

- Architecture documentation
- Project roadmap
- Architecture decisions
- Project context
- Session log
