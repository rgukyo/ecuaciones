/** Temas de la app, en el orden en que se estudian. */

export const CATALOG = [
  {
    id: "repaso",
    numero: "1",
    title: "Repaso",
    blurb: "Leyes de los signos, jerarquía de operaciones y términos semejantes.",
    color: "#2f6f9f",
    subtopics: [
      {
        id: "signos",
        title: "Leyes de los signos",
        short: "Signos",
        hint: "En multiplicación y división: signos iguales dan positivo y signos distintos dan negativo. Al restar, suma el opuesto.",
      },
      {
        id: "jerarquia",
        title: "Jerarquía de operaciones",
        short: "Jerarquía",
        hint: "Primero paréntesis, luego potencias, después multiplicaciones y divisiones de izquierda a derecha, y al final sumas y restas.",
      },
      {
        id: "semejantes",
        title: "Términos semejantes",
        short: "Semejantes",
        hint: "Solo se suman los términos con la misma parte literal. 3x y −x sí; 3x y 3x² no.",
      },
    ],
  },
  {
    id: "primer",
    numero: "2",
    title: "Ecuaciones de primer grado",
    blurb: "Ecuaciones simples, con paréntesis y con fracciones.",
    color: "#1e8e5a",
    subtopics: [
      {
        id: "simples",
        title: "Ecuaciones simples",
        short: "Simples",
        hint: "Lo que hagas de un lado, hazlo del otro. Deja las x juntas y los números del otro lado.",
      },
      {
        id: "parentesis",
        title: "Con paréntesis",
        short: "Paréntesis",
        hint: "Primero quita el paréntesis con la propiedad distributiva. Si hay un menos adelante, cambian los signos de adentro.",
      },
      {
        id: "fracciones",
        title: "Con fracciones",
        short: "Fracciones",
        hint: "Multiplica por el denominador, o por el mínimo común múltiplo si hay varios, para quitar los quebrados.",
      },
    ],
  },
  {
    id: "problemas",
    numero: "3",
    title: "Problemas razonados",
    blurb: "Edades, dinero, perímetros, números consecutivos y repartos.",
    color: "#d17a2a",
    subtopics: [
      {
        id: "problemas",
        title: "Problemas con ecuaciones",
        short: "Problemas",
        hint: "Nombra la incógnita, traduce el texto a una ecuación, resuelve y comprueba en el enunciado.",
      },
    ],
  },
  {
    id: "sistemas",
    numero: "4",
    title: "Sistemas 2×2",
    blurb: "Dos ecuaciones con dos incógnitas: sustitución, igualación y reducción.",
    color: "#6d5aa8",
    subtopics: [
      {
        id: "sustitucion",
        title: "Sustitución",
        short: "Sustitución",
        hint: "Despeja una letra en una ecuación y sustitúyela en la otra. Al final comprueba el par en las dos.",
      },
      {
        id: "igualacion",
        title: "Igualación",
        short: "Igualación",
        hint: "Si las dos ecuaciones dicen y = …, iguala esas dos expresiones y resuelve.",
      },
      {
        id: "reduccion",
        title: "Reducción",
        short: "Reducción",
        hint: "Suma o resta las ecuaciones para que una letra se cancele. Si los coeficientes son iguales, resta; si son opuestos, suma.",
      },
    ],
  },
  {
    id: "cuadraticas",
    numero: "5",
    title: "Ecuaciones cuadráticas",
    blurb: "Factorización, fórmula general y discriminante.",
    color: "#c4524a",
    subtopics: [
      {
        id: "factorizacion",
        title: "Factorización",
        short: "Factorización",
        hint: "Busca dos números que multiplicados den el término independiente y sumados den el coeficiente de x.",
      },
      {
        id: "formula",
        title: "Fórmula general",
        short: "Fórmula",
        hint: "Identifica a, b y c en ax² + bx + c = 0 y usa x = (−b ± √(b² − 4ac)) / (2a).",
      },
      {
        id: "discriminante",
        title: "Discriminante",
        short: "Discriminante",
        hint: "D = b² − 4ac. Si es positivo hay dos soluciones reales; si es cero, una; si es negativo, ninguna real.",
      },
    ],
  },
];

export function allSubtopics() {
  return CATALOG.flatMap((group) =>
    group.subtopics.map((sub) => ({ ...sub, group }))
  );
}

export function findSubtopic(id) {
  return allSubtopics().find((sub) => sub.id === id) || null;
}

export function findGroup(id) {
  return CATALOG.find((group) => group.id === id) || null;
}
