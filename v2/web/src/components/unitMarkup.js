import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import UnitSVG from './UnitSVG.jsx'

let counter = 0

export function unitMarkup(props) {
  const markup = renderToStaticMarkup(createElement(UnitSVG, { ...props, idPrefix: `m${counter++}` }))
  return markup.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
}
