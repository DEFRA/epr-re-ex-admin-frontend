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

```
project-root/
└── src/
    └── server/
        ├── routes/
        │   └── home/
        │       ├── controller.js
        │       ├── index.js
        │       └── index.njk
        └── common/
            ├── helpers/
            ├── components/
            └── templates/
```
