import { buttons } from './settings.js'
import { IO } from './IO.js'
import { Task } from './Task.js'
import { safeProp, curry, map, compose, maybe } from './utils.js'

function getCurrentTab (callback) {
  return chrome.tabs.getSelected(null, callback)
}

const createNewTabIO = url => new IO(() => chrome.tabs.create({ url }))

const getTabUrl = safeProp('url')

const getCurrentTabTask = () =>
  new Task((_, resolve) => getCurrentTab(resolve))

const createUrl = url => new URL(url)
const replaceUrlBeg = curry((redirectionUrlPrefix, url) => url.href.replace(url.origin, redirectionUrlPrefix))
const replaceUrlDomain = redirectionUrlPrefix => compose(replaceUrlBeg(redirectionUrlPrefix), createUrl)

const redirect = redirectionUrlPrefix =>
  compose(
    map(map(createNewTabIO)), // Task Maybe IO
    map(map(replaceUrlDomain(redirectionUrlPrefix))), // Task Maybe String
    map(getTabUrl), // Task Maybe String
    getCurrentTabTask // Task Object
  )

// not pure

document.addEventListener('DOMContentLoaded', onLoad, false)

const redirectExecute = urlPrefix =>
  compose(
    x =>
      x.fork(
        console.warn,
        maybe(null, x => x.unsafePerformIO())
      ),
    redirect(urlPrefix)
  )

function onLoad () {
  const buttonsElements = Object.entries(buttons).map(([name, urlPrefix]) => {
    const btn = document.createElement('button')
    btn.addEventListener('click', redirectExecute(urlPrefix), false)
    btn.textContent = '-> ' + name
    return btn
  })
  buttonsElements.forEach(btn => document.getElementById('buttons').appendChild(btn))
}
