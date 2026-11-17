## Answers to the questions

1. They render nothing from that component (or the HTL falls into its `data-sly-test` else-branch). `adaptTo` returned `null`, HTL's `data-sly-use` binds `null`, and `${model.title}` on `null` is simply empty. No exception is thrown anywhere — a classic silent failure. Fix: `@Optional` on the new field (or `defaultInjectionStrategy = OPTIONAL`) **and** a `@Default`/`isEmpty()`-style handling in the model.
2. With a required field the model is `null`: `"abc"` can't be converted to `Double`, so the injector reports nothing found. If the field is optional the model exists and `amount` is `null` (or `0.0` for a primitive `double`!). The primitive/object difference is itself a trap: `double amount` hides a missing value as `0`.
3. (a) The model lists only `SlingHttpServletRequest` as adaptable, and the test adapts a `Resource`. (b) A `@ScriptVariable`/`@RequestAttribute`/`@OSGiService` field is required and the test context (`AemContext`) hasn't set the binding/attribute/registered the service. Also common: the content the test loaded does not have a property the model requires; the model package isn't registered with the test context (`context.addModelsForClasses(...)`).
4. The first injects the *child node named `actions`* (one resource). The second injects the *children of* `actions` (`item0`, `item1` …) — that is how multifields stored as child nodes are read. Same annotation, different field type.
5. After injection of all fields, so `title` is set. If it was optional and absent, it's whatever the field initializer gives: `null` for objects, `0`/`false` for primitives. A good `@PostConstruct` guards for it.

## Walkthrough

### Task 1–3 — injectors

Each injector is a pure function from `(spec, fieldName, ctx)` to `found | not found`:

```ts
valueMap:   base(via).getValueMap().get(named ?? field, type)  -> null  => not found
child:      base(via).getChild(named ?? field) -> resource | model | children | models
self:       adaptable            (or adaptable adapted to a model)
osgi:       services[name]
script:     request.bindings[name]            (request only)
```

Notes:

- **Injectors never decide whether "missing" is fatal.** That's `adaptTo`'s job, because the answer depends on `@Optional`, `@Default` and the strategy. Keeping the policy in one place is what makes the behaviour predictable.
- `baseResource` is `@Via`: one helper, used by value *and* child injectors.
- `injectChild` with a list of models filters out children that don't adapt. (Real Sling's behaviour for partly-adaptable lists depends on the version; test yours.)
- `injectSelf` doesn't need the request/resource distinction: the adaptable *is* the answer.

### Task 4 — adaptTo

```ts
kind ok? -> new instance -> for each field: found ? assign
                                          : "default" in spec ? assign default
                                          : optional ? skip : return null
         -> @PostConstruct (try/catch -> null) -> instance
```

Details that the tests pin down:

- `"default" in spec`, not `spec.default !== undefined`: `@Default(booleanValues = false)` must count.
- Not-found + optional **does not touch the field**, so initializers (`sale = false`, `tags = []`) survive. Assigning `undefined` would erase them.
- `@PostConstruct` runs only if all injections succeeded and once per instance.
- `ctx.adapt` passes the *same* `context` down, so nested models get the same services.

## Real-world notes

- **Unit tests:** `io.wcm.testing.mock.aem.junit5.AemContext` (wcm.io AEM Mocks) registers models (`context.addModelsForClasses`), loads content from JSON (`context.load().json("/teaser.json", "/content/x")` — the same nested-JSON shape as this lab's fixture) and lets you `context.currentResource(...)` / `context.request()`. It is the closest thing to what you wrote here.
- **Injector order & `@Source`:** with `@Inject`, injectors are asked by service ranking, and `@Source("child")` / `@Source("script-bindings")` pins one.
- **Interface models:** a `@Model(adaptables = Resource.class) public interface Foo { @ValueMapValue String getTitle(); }` is valid; Sling generates the implementation. The semantics above hold.
- **Constructor injection** (`@Inject public Teaser(@Self Resource r)`) is supported and is the recommended style by the Sling team for new code since it enables `final` fields; the algorithm is the same.
- **Thread-safety:** adapting a `Resource` to a model is not cached, but the *model class* must not hold request-specific state in `static` fields or OSGi singletons.
