// Stylesheets are pulled in for their side effect only — webpack extracts them
// into a bundle. They carry no value bindings, so they get no exported shape.
// Deliberately not a module (no top-level import/export) so the declaration is
// ambient rather than an augmentation.
declare module '*.css'
