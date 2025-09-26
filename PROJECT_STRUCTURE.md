<!-- markdownlint-disable MD040 -->

# Project organisation

## Client v Server

The CDP frontend template already makes a separation between client and server code. It seems sensible to keep this separation since the reality is that it's unlikely we will be sharing much (if any) code between client and server.

Thus, the top-level structure of the project could look something like this:

```
project-root/
├── src/
│   ├── client/
│   ├── server/
│   └── config/
├── node_modules/
├── package.json
├── Dockerfile
└── ...
```

Separating `config` from logic seems like appropriate given that they tackle different concerns.

## Casing conventions

All files and folders across the repository should use `kebab-case` (lowercase words separated by hyphens).

## Client

This is mostly defined by the CDP frontend template and there is probably little need to get creative with it.

```
project-root/
└── src/
    └── client/
        ├── common/
        │   └── ...content structure defined by the template
        ├── javascripts/
        │   └── ...content structure defined by the template
        └── stylesheets/
            └── ...content structure defined by the template
```

## Server

### Routes

Different routes will be kept in different folders. Nested routes will be kept in nested folders. Reusability is encouraged via components and helpers.

Within a specific route's folder the files will not repeat the name of the folder and will use the structure:

- `index.js` (only job is to export a plugin that registers the route)
- `index.njk` (view template for the route)
- `controller.js`(handles the rest of the logic that is specific to the route)
- `controller.test.js` (unit tests for the controller, if needed)

### Components

Different components will be kept in different folders in a flat structure, i.e. all components will live directly under `components/`. This allows us to start with the simplest approach, which is also the one with the least cognitive load for the developer, in line with best practices.

This implies that sub-component is a dynamic concept, i.e. a component becomes a sub-component of another when referenced inside another component and not dictated by the folder structure. This is meant to facilitate refactoring.

```
project-root/
└── src/
    └── server/
        ├── routes/
        │   ├── home/
        │   │    ├── controller.js         (handles the rest of the logit that is specific to the route)
        │   │    ├── index.js              (in routes, index.js's job is to export a plugin that registers the route)
        │   │    └── index.njk             (index.njk is the view template for the route)
        │   ├── organisations/
        │   │    ├── controller.js
        │   │    ├── index.js
        │   │    └── index.njk
        ├── helpers/
        │   ├── logging/
        │   │    └── logger/
        │   │        ├── index.js
        │   │        └── index.njk
        │   └── authentication/
        │        └── auth-scope/
        │            ├── index.js
        │            └── index.njk
        ├── components/
        │   ├── heading/
        │   │    ├── _heading.scss              (component's styles)
        │   │    ├── macro.njk                  (convention to export the component's template with a given name)
        │   │    ├── template.njk               (the actual component's template)
        │   │    └── template.test.js           (unit tests for the component)
        │   └── heading-icon/
        │        ├── _heading.scss
        │        ├── macro.njk
        │        ├── template.njk
        │        └── template.test.js
        └── templates/
```

This structure

## Tests

### Unit tests

To facilitate discoverability and refactoring, unit tests must be always collocated with the code they test.

### Integration tests

Given that integration tests are fluid in their scope, it's useful to place them outside all other coding structures in order to make them less susceptible to refactoring.

Alternatively, if we decide to bind all integration tests to specific routes, we could place them in the respective route folders.

If we decide to go with the first option, the structure could look like this:

```
project-root/
└── src/
    ├── client/
    ├── server/
    ├── config/
    └── integration/
```
