/** Explicaciones originales para 3° de secundaria. */

export const LESSONS = {
  signos: {
    blocks: [
      { type: "p", text: "Los números con signo aparecen en cuanto despejas una ecuación. Hay tres ideas que conviene tener firmes antes de seguir." },
      { type: "h", text: "Suma" },
      { type: "ul", items: [
        "Mismo signo: se suman los valores absolutos y se conserva el signo. [[-7]] + [[-3]] = [[-10]].",
        "Signos distintos: se restan los valores absolutos y queda el signo del número más alejado del cero. [[-8]] + [[3]] = [[-5]].",
      ] },
      { type: "h", text: "Resta" },
      { type: "p", text: "Restar un número es **sumar su opuesto**. Así, [[5]] − ([[-2]]) se convierte en [[5]] + [[2]]." },
      { type: "h", text: "Multiplicación y división" },
      { type: "note", text: "Signos iguales → positivo. Signos distintos → negativo." },
      { type: "p", text: "Primero decides el signo con esa regla y después multiplicas o divides los valores absolutos. Si un factor es cero, el producto es cero." },
    ],
  },
  jerarquia: {
    blocks: [
      { type: "p", text: "Cuando hay varias operaciones, no siempre se resuelven de izquierda a derecha. El orden evita que dos personas obtengan resultados distintos del mismo ejercicio." },
      { type: "ol", items: [
        "Paréntesis, de adentro hacia afuera.",
        "Potencias.",
        "Multiplicaciones y divisiones, en el orden en que aparecen.",
        "Sumas y restas, en el orden en que aparecen.",
      ] },
      { type: "note", text: "En 2 + 3 × 4 primero va 3 × 4. El resultado es 14, no 20." },
      { type: "p", text: "Un caso que se confunde seguido: [[20]] − [[8]] + [[3]]. Como la suma y la resta están al mismo nivel, se hace de izquierda a derecha: primero 12 y después 15. No es 20 − 11." },
    ],
  },
  semejantes: {
    blocks: [
      { type: "p", text: "Dos términos son semejantes si tienen la misma parte literal: la misma letra y el mismo exponente. [[4x]] y [[-x]] sí lo son. [[4x]] y [[4x^2]] no. Los números sin letra también son semejantes entre sí." },
      { type: "p", text: "Para reducir, **suma los coeficientes** y deja igual la parte literal. Conviene agrupar primero los [[x^2]], luego las [[x]] y al final las constantes." },
      { type: "note", text: "El coeficiente de x, cuando no se escribe, es 1. El de −x es −1." },
    ],
  },
  simples: {
    blocks: [
      { type: "p", text: "Una ecuación de primer grado es una igualdad con la incógnita a la potencia 1. Resolverla es encontrar el valor que la hace verdadera." },
      { type: "p", text: "Piensa en una balanza: **lo que hagas en un lado, hazlo en el otro**." },
      { type: "ul", items: [
        "Si un número está sumando, réstalo en los dos lados.",
        "Si está restando, súmalo en los dos lados.",
        "Si está multiplicando, divide los dos lados entre ese número. Nunca dividas entre cero.",
        "Junta todas las x de un lado y los números del otro.",
      ] },
      { type: "p", text: "Al terminar, sustituye tu resultado en la ecuación original. Los dos lados deben valer lo mismo." },
    ],
  },
  parentesis: {
    blocks: [
      { type: "p", text: "Si la x está dentro de un paréntesis, primero aplica la propiedad distributiva: a(b + c) = ab + ac. Después la ecuación ya es de las que sabes resolver." },
      { type: "note", text: "Si el número de adelante es negativo, cambia el signo de cada término de adentro. −(x − 3) = −x + 3." },
      { type: "p", text: "Cuando hay dos paréntesis, distribuye cada uno y luego junta los términos semejantes antes de despejar." },
    ],
  },
  fracciones: {
    blocks: [
      { type: "p", text: "Si la x está en un quebrado, quita el denominador multiplicando **toda** la ecuación por ese número. Si hay varios denominadores, usa el mínimo común múltiplo y multiplica cada término." },
      { type: "p", text: "No dejes ningún término sin multiplicar. Cuando la ecuación ya no tenga fracciones, resuélvela como una ecuación simple y comprueba en la original." },
      { type: "note", text: "Un denominador nunca puede ser cero. En estas ecuaciones los denominadores son números distintos de cero." },
    ],
  },
  problemas: {
    blocks: [
      { type: "p", text: "Un problema razonado se traduce a una ecuación. La incógnita es la cantidad que te preguntan, o una cantidad de la que salen las demás." },
      { type: "ol", items: [
        "Lee completo y distingue datos, relación y pregunta.",
        "Escribe «sea x = …» con la unidad: años, pesos o metros.",
        "Expresa las otras cantidades usando x.",
        "Arma la ecuación con la suma, el perímetro o el total de dinero.",
        "Resuelve y responde con una frase.",
        "Comprueba en el texto, no solo en la ecuación.",
      ] },
      { type: "p", text: "Por ejemplo, si un precio es «15 pesos menos», eso se escribe x − 15. Si alguien tiene «4 años más que el doble», eso es 2x + 4. Tres números consecutivos son x, x + 1 y x + 2." },
    ],
  },
  sustitucion: {
    blocks: [
      { type: "p", text: "Un sistema 2×2 tiene dos ecuaciones y dos incógnitas. La solución es un par (x, y) que cumple las dos al mismo tiempo." },
      { type: "p", text: "En la **sustitución** despejas una letra en la ecuación que se vea más fácil y la cambias, con todo y paréntesis, en la otra ecuación. Te queda una ecuación de una sola incógnita." },
      { type: "ol", items: [
        "Deja una variable despejada, por ejemplo y = …",
        "Sustitúyela en la otra ecuación.",
        "Resuelve.",
        "Regresa ese valor para encontrar la otra letra.",
        "Comprueba el par en las dos ecuaciones.",
      ] },
    ],
  },
  igualacion: {
    blocks: [
      { type: "p", text: "La **igualación** sirve cuando las dos ecuaciones tienen despejada la misma letra, o cuando puedes despejarla sin mucha complicación." },
      { type: "p", text: "Si y es igual a una expresión y también es igual a otra, esas dos expresiones son iguales entre sí. Igualas los lados derechos, resuelves para x y después encuentras y." },
      { type: "note", text: "Si al igualar se te anula la x y queda un número distinto de cada lado, el sistema no tiene solución. Si queda 0 = 0, tiene infinitas. En la práctica de esta app los sistemas tienen una sola solución." },
    ],
  },
  reduccion: {
    blocks: [
      { type: "p", text: "La **reducción** (suma y resta) cancela una de las letras. Primero acomoda las x, las y y el número en columnas." },
      { type: "ul", items: [
        "Si una letra tiene coeficientes opuestos, suma las ecuaciones.",
        "Si tiene el mismo coeficiente, resta una ecuación de la otra.",
        "Si no coinciden, multiplica antes una ecuación por un número para igualarlos.",
      ] },
      { type: "p", text: "Con la ecuación de una letra que queda, despeja. Luego sustituye en cualquiera de las originales para hallar la otra. Comprueba el par en las dos." },
    ],
  },
  factorizacion: {
    blocks: [
      { type: "p", text: "Una ecuación cuadrática tiene x al cuadrado. La forma general es ax² + bx + c = 0. En este tema a = 1, así que buscamos factorizar x² + bx + c." },
      { type: "p", text: "Necesitas dos números que **multiplicados den c** y **sumados den b**. Entonces la ecuación se escribe (x + m)(x + n) = 0." },
      { type: "note", text: "Un producto es cero solo si alguno de los factores es cero. De cada factor sale una solución." },
      { type: "p", text: "Si m es negativo, el factor se ve como una resta. Por ejemplo, m = −3 da el factor (x − 3) y la solución x = 3. Comprueba las dos soluciones en la ecuación original." },
    ],
  },
  formula: {
    blocks: [
      { type: "p", text: "Cuando no es cómodo factorizar, o el coeficiente de x² no es 1, usa la fórmula general. Antes pasa todos los términos al mismo lado para que la ecuación quede igual a cero." },
      { type: "formula", text: "x = (−b ± √(b² − 4ac)) / (2a)" },
      { type: "ul", items: [
        "Identifica a, b y c, con su signo.",
        "Calcula el discriminante D = b² − 4ac.",
        "Si D es un cuadrado perfecto, la raíz sale exacta.",
        "Haz la cuenta dos veces: una con el signo más y otra con el menos.",
        "Simplifica cada fracción y comprueba.",
      ] },
      { type: "p", text: "El signo ± significa que hay dos posibilidades. No elijas solo una si el discriminante es positivo." },
    ],
  },
  discriminante: {
    blocks: [
      { type: "p", text: "El discriminante resume cuántas soluciones reales tiene ax² + bx + c = 0, sin que tengas que terminar de resolver." },
      { type: "formula", text: "D = b² − 4ac" },
      { type: "ul", items: [
        "Si D > 0, hay dos soluciones reales distintas.",
        "Si D = 0, hay una solución real: es una raíz doble.",
        "Si D < 0, no hay solución real.",
      ] },
      { type: "note", text: "Un discriminante negativo no significa que te hayas equivocado. A veces la ecuación de verdad no tiene solución real." },
    ],
  },
};
