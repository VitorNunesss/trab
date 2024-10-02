const gradePersonagens = document.getElementById('characterGrid');
const entradaBusca = document.getElementById('searchInput');
const botaoFiltroFavoritos = document.getElementById('favoriteFilter');
const filtroEspecie = document.getElementById('speciesFilter');
const filtroStatus = document.getElementById('statusFilter');

let paginaAtual = 1;   
let carregando = false;  
let favoritos = JSON.parse(localStorage.getItem('favorites')) || []; 
let mostrarFavoritosApenas = false;
let todosOsPersonagens = []; 
let idsPersonagensRenderizados = new Set(); 

function salvarFavoritos() {
    localStorage.setItem('favorites', JSON.stringify(favoritos));
}

function alternarFavorito(id) {
    const indice = favoritos.indexOf(id); 
    if (indice > -1) {
        favoritos.splice(indice, 1); 
    } else {
        favoritos.push(id); 
    }
    salvarFavoritos(); 
    renderizarPersonagens(); 
}

function traduzirEspecie(especie) {
    const traducaoEspecie = {
        "Human": "Humano",
        "Alien": "Alienígena",
    };
    return traducaoEspecie[especie] || especie; 
}

function traduzirStatus(status) {
    const traducaoStatus = {
        "Alive": "Vivo",
        "Dead": "Morto",
        "unknown": "Desconhecido"
    };
    return traducaoStatus[status] || status; 
}

function criarCartaoPersonagem(personagem) {
    const cartaoPersonagem = document.createElement('div'); 
    cartaoPersonagem.classList.add('character-card'); 

    const classeFavorito = favoritos.includes(personagem.id) ? 'favorited' : '';

    cartaoPersonagem.innerHTML = `
        <img src="${personagem.image}" alt="${personagem.name}">
        <h3>${personagem.name}</h3>
        <span class="favorite ${classeFavorito}" data-id="${personagem.id}">★</span>
        <div class="character-details">
            <p>Status: ${traduzirStatus(personagem.status)}</p>
            <p>Espécie: ${traduzirEspecie(personagem.species)}</p>
        </div>
    `;

    cartaoPersonagem.querySelector('.favorite').onclick = () => alternarFavorito(personagem.id);
    
    gradePersonagens.appendChild(cartaoPersonagem); 
}

function buscarPersonagemPorId(id) {
    return fetch(`https://rickandmortyapi.com/api/character/${id}`)
        .then(response => response.json())
        .catch(error => {
            console.log('Erro ao buscar personagem:', error);
        });
}

function buscarPersonagens(pagina) {
    if (carregando) return; 
    carregando = true; 

    fetch(`https://rickandmortyapi.com/api/character/?page=${pagina}`)
        .then(response => response.json())
        .then(data => {
            todosOsPersonagens = [...todosOsPersonagens, ...data.results]; 
            renderizarPersonagensFiltrados(todosOsPersonagens); 
            carregando = false;  
        })
        .catch(error => {
            console.log(error); 
            carregando = false; 
        });
}

function buscarPersonagensPorBusca(query) {
    fetch(`https://rickandmortyapi.com/api/character/?name=${query}`)
        .then(response => response.json())
        .then(data => {
            gradePersonagens.innerHTML = ''; 
            data.results.forEach(criarCartaoPersonagem); 
        })
        .catch(error => {
            console.log('Nenhum personagem encontrado', error); 
            gradePersonagens.innerHTML = '<p>Nenhum personagem encontrado</p>';
        });
}

function filtrarPersonagens(personagens) {
    const especie = filtroEspecie.value; 
    const status = filtroStatus.value; 

    return personagens.filter(personagem => {
        const correspondeEspecie = especie ? personagem.species === especie : true;
        const correspondeStatus = status ? personagem.status === status : true;
        return correspondeEspecie && correspondeStatus;
    });
}

function renderizarPersonagensFiltrados(personagens) {
    const personagensFiltrados = filtrarPersonagens(personagens);
    personagensFiltrados.forEach(personagem => {
        if (!idsPersonagensRenderizados.has(personagem.id)) {
            criarCartaoPersonagem(personagem);
            idsPersonagensRenderizados.add(personagem.id); 
        }
    });
}

function renderizarPersonagens() {
    gradePersonagens.innerHTML = ''; 
    idsPersonagensRenderizados.clear(); 
    if (mostrarFavoritosApenas) {
        const favoritosFiltrados = favoritos.map(buscarPersonagemPorId); 
        Promise.all(favoritosFiltrados).then(renderizarPersonagensFiltrados);
    } else {
        buscarPersonagens(paginaAtual); 
    }
}

entradaBusca.addEventListener('input', (e) => {
    const query = e.target.value.trim(); 
    gradePersonagens.innerHTML = ''; 
    query.length ? buscarPersonagensPorBusca(query) : renderizarPersonagens(); 
});

botaoFiltroFavoritos.addEventListener('click', () => {
    mostrarFavoritosApenas = !mostrarFavoritosApenas; 
    botaoFiltroFavoritos.textContent = mostrarFavoritosApenas ? 'Mostrar Todos' : 'Mostrar Favoritos';
    renderizarPersonagens();
});

filtroEspecie.addEventListener('change', () => {
    renderizarPersonagens(); 
});

filtroStatus.addEventListener('change', () => {
    renderizarPersonagens(); 
});

window.addEventListener('scroll', () => {
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 100 && !carregando) {
        paginaAtual++; 
        buscarPersonagens(paginaAtual); 
    }
});

renderizarPersonagens();
