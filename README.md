# JSON Patch Rules
Tools and specification for defining rules about how a json patch should be applied to an object.

## Motivation
[RFC 6902](http://tools.ietf.org/html/rfc6902) defines the [JSON Patch](http://jsonpatch.com) specification which allows for an object transformation by applying a set of operations. While not limited to REST APIs, a primary use case of JSON Patch is with a PATCH verb applied to an entity located at a RESTful URI.

On the client side, it is frequently necessary or desirable to perform some logic to determine whether a PATCH operation should be applied. JSON Patch has rudimentary support for this with the "test" operation, but this is limited to a simple value check at a path. This limitation is being addressed at the [IETF by J.M. Snell](https://tools.ietf.org/id/draft-snell-json-test-01.html) with the [JSON Predicates](https://github.com/MalcolmDwyer/json-predicate) spec.

This repository proposes a specification and some tools for addressing the server side of the PATCH process.

## The Problem
In real world PATCH scenarios, it is rare, if ever, that the server can completely trust a PATCH document sent by a client. Image we have a user object that looks something like:

```javascript
{
    username: 'beeblez',
    email: 'zaphod@beeblebrox.com',
    password_hash: '...',
    role: 'worker'
}
```

A patch document that looks like

```javascript
[{"op":"replace", "path": "/email", "value":"beebz@gmail.com"}]
```
could be perfectly acceptable, allowing the user to change their email address, assuming authentication/authorization on the REST endpoint passes.

It is pretty unlikely that we'd want a user to be able to submit a PATCH that looks like this, though:
```javascript
[{"op":"replace", "path": "/role", "value":"god-mode"}] //now I own everything!
```

This situation leaves it up to each server implementation to explicitly check patch paths and verify rules, which can be tedius. This project provies a propsed spec and a simple utility to declaratively define PATCH rules.

## The Spec
A rule set is simply a JSON array of rule objects. A rule object is designed to be similar in structure to a JSON Patch operation object, and in its simplest form looks like:

```javascript
{ "path": "/email", "op":"replace" }
```

This rule indicates that the "replace" operation is allowed on the "email" property.

Multiple operations can be specified like
```javascript
[
    { "path": "/email", "op":"replace" }
    { "path": "/email", "op":"delete" }
]
```
or, as shorthand the "op" property can be an array:
```javascript
{ "path": "/email", "op":["replace","delete"] }
```

a simple test can be applied with RegEx:
```javascript
//make sure the value looks like an email
{ 
    "path": "/email", 
    "op":["replace"], 
    "value": "[^@]+@[^\.]+\..+"
}
```

if specified, the "value" property will always be interpreted as a regular expression.

"from" and "path" will also be intpreted as a regular expression if the first two characters are "^/". Since all valid JSON Pointer paths begin with "/", "^/" indicates that a RegEx should be applied to match the path starting with "/".

```javascript

//only allow values from the 'all_friends' array to be moved to
//the 'best_friends' array
{ 
    "from": "^/all_friends/.+", 
    "path": "^/best_friends/.+", 
    "op":"move"
}
```


As with JSON Patch, the "path" and "from" properties are [RFC 6901](https://tools.ietf.org/html/rfc6901) JSON Pointer paths, or a regex to match a path.

Using the "value" property with a regex allows for simple tests, which are appropriate for many situations. For more complex rules, JSON Predicate rule checks can be applied:

```javascript
{
    "path": "/age",
    "op":"replace",
    "test": [
        {"op":"type", "path":"/value", "value":"number"},
        {"op":"less", "path":"/value", "value":120},
        {"op":"more", "path":"/value", "value":0},
    ]
}

```

"test" supports nesting and complex rules, as [as explained in the RFC](https://tools.ietf.org/id/draft-snell-json-test-01.html#rfc.section.2.3.4).

For tests can be applied widely by omitting "path" and/or "op" properties:

```javascript
//this will be applied to all 'delete' patch operations
{
    "op": ["delete"],
    "test": [
        {"op":"contains", "path":"/path", "value":"inactive"},
    ]
}

//this will be applied to all operations on the 'friends' path
{
    "path": "/friends",
    "test": [
        ...
    ]
}
```
There are two approaches to rule specifications, fields can be whitelisted or blacklisted. This determines what action should be taken when a patch operation is applied to a path where there is no rule specified.

Since either approach is valid depending on the use scenario, the rules specification itself doesn't indicate which approach should be used. Instead, this is left as an implementation detail that should be indicated via configuration or options by the JSON Patch Rules tool.