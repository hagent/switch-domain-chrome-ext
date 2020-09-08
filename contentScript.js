
const elements = [...document.querySelectorAll('[name=payment-method]')]
elements.forEach(el => {
  const newel = document.createElement('div')
  let text = el.id
  switch (text) {
    case 'payment-method-20': text += ' (cyber)'
  }
  newel.innerText = text
  el.parentNode.appendChild(newel)
  el.parentNode.position = 'relative'
  newel.style.color = 'green'
  newel.style.position = 'absolute'
  newel.style.top = '0'
  newel.style.left = '5px'
  newel.style['font-weight'] = 'bold';
})
