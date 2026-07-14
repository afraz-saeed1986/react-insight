# Roadmap

## Phase 1 — Core

### Foundation

- [x] Project setup
- [x] Workspace
- [x] Build system
- [x] Shared ESLint configuration

### Core Architecture

- [x] Runtime
- [x] Generic Runtime
- [x] Runtime destruction lifecycle
- [x] Runtime state protection
- [x] PluginManager
- [x] Generic PluginManager
- [x] Plugin lifecycle
- [x] Generic PluginContext
- [x] Generic InsightPlugin
- [x] Generic `definePlugin()`
- [x] EventBus
- [x] Subscription
- [x] SubscriptionRegistry

### Built-in Plugins

- [x] Logger Plugin
- [x] Logger Plugin factory API

### Quality

- [x] Runtime integration tests
- [x] EventBus unit tests
- [x] Subscription unit tests
- [x] SubscriptionRegistry unit tests
- [x] PluginManager unit tests
- [x] Logger Plugin integration tests
- [x] ESLint
- [x] TypeScript strict type checking
- [x] Coverage thresholds
- [x] GitHub Actions CI

### Playground

- [x] Playground package created
- [x] Workspace integration
- [x] Public API validation
- [x] Initial demo

---

## Phase 2 — React

### Foundation

- [x] React package
- [x] Package build configuration
- [x] Public package exports
- [x] Internal architecture layer

### Public API

- [x] `createInsight()`
- [x] `InsightProvider`
- [x] `useInsight()`
- [x] Runtime encapsulation
- [x] Public API tests
- [x] React integration tests

### React Runtime

- [ ] Root registration
- [ ] React Runtime integration
- [ ] Runtime lifecycle synchronization

### Tracking

- [ ] Component tracking
- [ ] Render tracking
- [ ] State tracking
- [ ] Hook tracking
- [ ] Context tracking

---

## Phase 3 — Inspector

### Core

- [ ] Inspector
- [ ] Session
- [ ] Internal communication

### DevTools

- [ ] DevTools Panel
- [ ] Timeline
- [ ] Search
- [ ] Filters

---

## Phase 4 — Release

### Quality

- [ ] Benchmarks
- [ ] Performance profiling

### Documentation

- [ ] Documentation
- [ ] Examples
- [ ] API Reference

### Release

- [ ] npm publish
- [ ] GitHub Release
- [ ] Versioning strategy
