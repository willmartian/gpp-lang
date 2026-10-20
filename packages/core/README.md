# @spp-lang/core

[Spec++](https://github.com/willmartian/spp-lang)'s language: its words, its checker, and the
driver contract a backend implements to run the words on its platform. Every backend runs the
same words. It runs anywhere, a browser too; `@spp-lang/core/node` has what needs Node, like
finding a project's files.

You don't install it yourself: `spp-lang` and each backend depend on it.
