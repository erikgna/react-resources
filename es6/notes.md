## log “this” dentro da funcao e arrow func
- when logging the arrow function, I got a empty object {}
- while logging the function, gave me a lot of methods, like intervals, crypto, fetch...

## object.assign vs spread
- spread creates a new immutable object
- assign mutates the current object and call setters on the target object

## Como o JS faz um objecto read only

```
Object.defineProperty(obj, 'readOnlyProp', {
  value: 'This is a read-only value',
  writable: false, // Prevents reassignment
});
```

---

```
const obj = {
  get readOnlyProp() {
    return 42;
  }
};
```

--

```
class Car {
  #serialNumber; // Private field

  constructor(serialNumber) {
    this.#serialNumber = serialNumber; // Can be assigned in the constructor
  }

  get serialNumber() { // Public getter for read-only access
    return this.#serialNumber;
  }
}
```

## Por que usar entries
ele retorna uma array de chave-valor dos pares de um objeto, ajuda a iterar ou tranformar.

## objeto puro e map
**object**

key must be string or symbol, to get length must convert to array, not iterable, not performatic for add/remove, entry insertion order nowadays (but not 100% reliable)

**map**

key any value, easy to get the length, is iterable, performatic for add/remove, entry insertion order

## quando acontece o get e o set de um objeto (verificar o que triga o proxy)

GET
```
proxy.name          // leitura direta
proxy["age"]        // leitura por string

user.age // NAO dispara get
```

---

SET
```
proxy.age = 41
proxy["age"] = 50
```

achei que tua explicacao no primeiro slide nao encaixou muito bem com a imagem.
talvez mantem ela so enquanto ta explicando que o mock é um replacement do real server, mas depois quando tu ta falando dos tipos de mocks poderia ser outro slide com imagens diferentes exemplificando cada uma
pode ser um slide falando do stubs e uma imagem mostrando, pode botar um trecho de codigo tbm mas se a imagem do stub for boa nao precisa pra nao poluir demais
module mocks faria em um outro slide, assim tu da uma opcao visual pro pessoal acompanhar tua explicacao
network simulation em outro slide, mesmo motivo dos de cima. Ele serve de gancho pra tu explicar o mock service worker
Titulo do segundo slide esta Service Work and Fetch API? . acho que tira o ?
essa background thread onde ele roda, fica onde? no browser? no OS do usuario?
separated from our tabs , o que é essas tabs?
como o browser sabe que tem que bater no service worker primeiro? onde isso é configurado e como?
Titulo do terceiro slide ta com typo (Money Patching)
senti falta da explicacao de como tu faz para remover o mock de uma request, ou caso tu queira manter o mock apenas para os testes e o restante deve bater na API
qual o impacto usando o MSW comparando com simplesmente mockar as requests via jest?
um ponto bem interessante sobre mockar requests que tu falou no final sobre testar contratos e nao implementacao, é que tu habilita o time de front a começar a implementacao sem que o backend esteja pronto, de uma maneira menos disruptiva
