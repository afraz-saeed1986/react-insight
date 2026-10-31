import { installReactDevtoolsHook } from "./internal/discovery/hookAdapter";

// Importing this module installs the DevTools global hook as a side effect.
// It must be the first import of the app entry, before react-dom is loaded.
// See "installReactDevtoolsHook()" in the README for the explicit alternative.
installReactDevtoolsHook();