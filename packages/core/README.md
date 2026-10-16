# @spp-lang/core

[Spec++](https://github.com/willmartian/spp-lang)'s language and checker, and what its backends
are made of: the shared words, the driver they run on, and the `Backend` interface a project's
`spp.config.ts` lists. It runs anywhere, a browser too; `@spp-lang/core/node` has what needs
Node, like finding a project's files.

You don't install it yourself: `spp-lang` and each backend depend on it.
