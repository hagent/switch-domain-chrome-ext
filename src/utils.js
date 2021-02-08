export function curry (fn) {
  const arity = fn.length

  return function $curry (...args) {
    if (args.length < arity) {
      return $curry.bind(null, ...args)
    }

    return fn.call(null, ...args)
  }
}

export const identity = x => x

// map :: Functor f => (a -> b) -> f a -> f b
export const map = curry((fn, f) => f.map(fn))

// either :: (a -> c) -> (b -> c) -> Either a b -> c
export const either = curry((f, g, e) => {
  if (e.isLeft) {
    return f(e.$value)
  }

  return g(e.$value)
})

export const compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args)))

// liftA2 :: (Applicative f) => (a1 -> a2 -> b) -> f a1 -> f a2 -> f b
export const liftA2 = curry((fn, a1, a2) => {
  // console.log({ a1 }, a1.toString(), a1.name);
  return a1.map(fn).ap(a2)
})

export const lift2 = curry((f, g, h, x) => {
  // console.log('lift2', {x})
  return liftA2(f, g(x), h(x))
})

export class Either {
  constructor (x) {
    this.$value = x
  }

  // ----- Pointed (Either a)
  static of (x) {
    return new Right(x)
  }
}

export class Left extends Either {
  get isLeft () {
    return true
  }

  get isRight () {
    return false
  }

  static of (x) {
    throw new Error(
      '`of` called on class Left (value) instead of Either (type)'
    )
  }

  inspect () {
    return `Left(${inspect(this.$value)})`
  }

  // ----- Functor (Either a)
  map () {
    return this
  }

  // ----- Applicative (Either a)
  ap () {
    return this
  }

  // ----- Monad (Either a)
  chain () {
    return this
  }

  join () {
    return this
  }

  // ----- Traversable (Either a)
  sequence (of) {
    return of(this)
  }

  traverse (of, fn) {
    return of(this)
  }
}

export class Right extends Either {
  get isLeft () {
    return false
  }

  get isRight () {
    return true
  }

  static of (x) {
    throw new Error(
      '`of` called on class Right (value) instead of Either (type)'
    )
  }

  inspect () {
    return `Right(${inspect(this.$value)})`
  }

  // ----- Functor (Either a)
  map (fn) {
    return Either.of(fn(this.$value))
  }

  // ----- Applicative (Either a)
  ap (f) {
    return f.map(this.$value)
  }

  // ----- Monad (Either a)
  chain (fn) {
    return fn(this.$value)
  }

  join () {
    return this.$value
  }

  // ----- Traversable (Either a)
  sequence (of) {
    return this.traverse(of, identity)
  }

  traverse (of, fn) {
    fn(this.$value).map(Either.of)
  }
}

export const id = x => x

// inspect :: a -> String
export const inspect = x => {
  if (x && typeof x.inspect === 'function') {
    return x.inspect()
  }

  function inspectFn (f) {
    return f.name ? f.name : f.toString()
  }

  function inspectTerm (t) {
    switch (typeof t) {
      case 'string':
        return `'${t}'`
      case 'object': {
        const ts = Object.keys(t).map(k => [k, inspect(t[k])])
        return `{${ts.map(kv => kv.join(': ')).join(', ')}}`
      }
      default:
        return String(t)
    }
  }

  function inspectArgs (args) {
    return Array.isArray(args)
      ? `[${args.map(inspect).join(', ')}]`
      : inspectTerm(args)
  }

  return typeof x === 'function' ? inspectFn(x) : inspectArgs(x)
}

export const trace = (msg = 'Trace check: ') => x => {
  console.log(msg, inspect(x))
  if (x && x instanceof Task) {
    x.fork(
      x => console.log(msg, 'TASK ERROR', inspect(x)),
      x => console.log(msg, 'TASK RESULT', inspect(x))
    )
  }
  return x
}

export class Maybe {
  get isNothing () {
    return this.$value === null || this.$value === undefined
  }

  get isJust () {
    return !this.isNothing
  }

  constructor (x) {
    this.$value = x
  }

  inspect () {
    return this.isNothing ? 'Nothing' : `Just(${inspect(this.$value)})`
  }

  // ----- Pointed Maybe
  static of (x) {
    return new Maybe(x)
  }

  // ----- Functor Maybe
  map (fn) {
    return this.isNothing ? this : Maybe.of(fn(this.$value))
  }

  // ----- Applicative Maybe
  ap (f) {
    return this.isNothing ? this : f.map(this.$value)
  }

  // ----- Monad Maybe
  chain (fn) {
    return this.map(fn).join()
  }

  join () {
    return this.isNothing ? this : this.$value
  }

  // ----- Traversable Maybe
  sequence (of) {
    return this.traverse(of, identity)
  }

  traverse (of, fn) {
    return this.isNothing ? of(this) : fn(this.$value).map(Maybe.of)
  }
}

// head :: [a] -> a
export const head = xs => xs[0]

// safeHead :: [a] -> Maybe a
export const safeHead = compose(Maybe.of, head)

// prop :: String -> Object -> a
export const prop = curry((p, obj) => obj[p])

// safeProp :: String -> Object -> Maybe a
export const safeProp = curry((p, obj) => compose(Maybe.of, prop(p))(obj))

// match :: RegExp -> String -> Boolean
export const match = curry((re, str) => re.test(str))

// match :: RegExp -> String -> Boolean
export const reExec = curry((re, str) => re.exec(str))

// safeProp :: String -> Object -> Maybe a
export const safeMatch = curry((p, obj) => compose(Maybe.of, match(p))(obj))

// safeProp :: String -> Object -> Maybe a
export const safeReExec = curry((p, obj) => compose(Maybe.of, reExec(p))(obj))

// join :: Monad m => m (m a) -> m a
export const join = m => m.join()

// chain :: Monad m => (a -> m b) -> m a -> m b
export const chain = curry((fn, m) => m.chain(fn))

export const prepand = curry((urlBeg, urlEnd) => urlBeg + urlEnd)
export const append = curry((urlEnd, urlBeg) => urlBeg + urlEnd)

// traverse :: (Applicative f, Traversable t) => (a -> f a) -> (a -> f b) -> t a -> f (t b)
export const traverse = curry((of, fn, f) => f.traverse(of, fn))

// maybe :: b -> (a -> b) -> Maybe a -> b
export const maybe = curry((v, f, m) => {
  if (m.isNothing) {
    return v
  }

  return f(m.$value)
})

// sequence :: (Applicative f, Traversable t) => (a -> f a) -> t (f a) -> f (t a)
export const sequence = curry((of, f) => f.sequence(of))

export class List {
  constructor (xs) {
    this.$value = xs
  }

  inspect () {
    return `List(${inspect(this.$value)})`
  }

  concat (x) {
    return new List(this.$value.concat(x))
  }

  // ----- Pointed List
  static of (x) {
    return new List([x])
  }

  // ----- Functor List
  map (fn) {
    return new List(this.$value.map(fn))
  }

  // ----- Traversable List
  sequence (of) {
    return this.traverse(of, identity)
  }

  traverse (of, fn) {
    return this.$value.reduce(
      (f, a) => fn(a).map(b => bs => bs.concat(b)).ap(f),
      of(new List([]))
    )
  }
}
