const currentDate = new Date()
const apiUrl = 'http://servicodados.ibge.gov.br/api/v3/noticias'
const siteUrl = 'https://agenciadenoticias.ibge.gov.br/'
let modal
let nextPage = 2
let hasNextPage = true

document.addEventListener('DOMContentLoaded', () => {
  const url = new URL(window.location)
  modal = document.querySelector('dialog')

  if (!url.searchParams.has('qtd')) {
    url.searchParams.set('qtd', '10')
  }

  window.history.pushState({}, '', url)
  buscarNoticias()
  carregaFiltros()
})

function carregaFiltros() {
  const url = new URL(window.location)
  let count = 0
  url.searchParams.forEach((value, key) => {
    if (key === 'page') {
      return
    }

    if (key === 'busca') {
      document.querySelector('.form-busca [name="busca"]').value = value
    }

    const input = document.querySelector(`.filtros [name="${key}"]`)

    if (input) {
      count++
      input.value = value
    }
    document.querySelector('#numero-filtro').textContent = count
  })
}

function abrirModal() {
  modal.showModal()
}

function fecharModal() {
  modal.close()
}

function filtroSubmit(ev) {
  ev.preventDefault()
  let count = 0
  const form = new FormData(ev.target)

  const url = new URL(window.location)

  form.entries().forEach(([key, value]) => {
    if (value) {
      if (key !== 'busca') {
        count++
      }
      url.searchParams.set(key, value)
    } else {
      url.searchParams.delete(key)
    }
  })

  document.querySelector('#numero-filtro').textContent = count
  window.history.pushState({}, '', url)

  buscarNoticias()
  fecharModal()
}

function buscaTermo(ev) {
  ev.preventDefault()
  const busca = new FormData(ev.target).get('busca')?.trim()

  if (busca) {
    const url = new URL(window.location)
    url.searchParams.set('busca', busca)
    window.history.pushState({}, '', url)
    buscarNoticias()
  }
}

async function buscarNoticias() {
  const url = `${apiUrl}?${window.location.search.slice(1)}`
  try {
    const response = await fetch(url)
    const data = await response.json()
    nextPage = data.nextPage
    exibirNoticias(data.items)
    criarPaginacao({
      totalPages: data.totalPages,
      currentPage: data.page,
    })
  } catch (e) {
    console.error('Erro ao buscar notícias:', e)
  }
}

function criarPaginacao({ totalPages, currentPage }) {
  const pagination = document.getElementById('paginacao')
  pagination.innerHTML = ''

  let startPage, endPage
  if (totalPages <= 10) {
    startPage = 1
    endPage = totalPages
  } else {
    if (currentPage <= 5) {
      startPage = 1
      endPage = 10
    } else if (currentPage + 4 >= totalPages) {
      startPage = totalPages - 9
      endPage = totalPages
    } else {
      startPage = currentPage - 5
      endPage = currentPage + 4
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const li = document.createElement('li')
    const pageBtn = document.createElement('button')
    pageBtn.textContent = i
    if (i === currentPage) {
      pageBtn.classList.add('active')
    }
    pageBtn.onclick = function () {
      const url = new URL(window.location)
      url.searchParams.set('page', i)
      window.history.pushState({}, '', url)
      window.scrollTo(0, 0)
      buscarNoticias()
    }
    li.appendChild(pageBtn)
    pagination.appendChild(li)
  }
}

function exibirNoticias(data) {
  const noticiasContainer = document.getElementById('noticias')

  noticiasContainer.innerHTML = ''

  data.forEach((noticia, i) => {
    const imagens = JSON.parse(noticia.imagens)
    // var dateParts = noticia.data_publicacao.split(' ')[0].split('/')

    var dateObject = new Date(noticia.data_publicacao)
    const d = getNumberOfDays(dateObject)
    const noticiaElement = document.createElement('li')
    noticiaElement.classList.add('noticia')
    noticiaElement.innerHTML = `
          <img src="${siteUrl}${imagens.image_intro}" alt="Imagem da noticia ${
      i + 1
    }">
          <div>
            <h2>${noticia.titulo}</h2>
            <p>${noticia.introducao}</p>
            <p class="tags">
              <span> #${noticia.editorias.split(';').join(' #')} </span>
              <span>Publicado ${
                d === 0 ? 'hoje' : d === 1 ? 'ontem' : d + ' dias atrás'
              } </span>
            </p>
            <a href="${noticia.link}" target="_blank">Leia mais</a>
          <div>
        `
    noticiasContainer.appendChild(noticiaElement)
  })
}

function getNumberOfDays(start) {
  const date1 = new Date(start)
  const oneDay = 1000 * 60 * 60 * 24

  const diffInTime = currentDate.getTime() - date1.getTime()

  const diffInDays = Math.round(diffInTime / oneDay)

  return diffInDays
}
