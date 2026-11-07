/* Catálogo de la tienda · Promociones de Navidad 2026 (packs 1–11)
   Lo usan la web (window.LOE_CATALOG) y el servidor de pagos (/api/checkout.js),
   así los precios que se cobran en Stripe salen siempre de este mismo archivo. */
(function (root) {
  var CATALOG = [
    {
      "id": "ritual-belleza-bienestar",
      "handle": "ritual-belleza-bienestar",
      "name": "Ritual Belleza & Bienestar",
      "price": 98.5,
      "description": "<p>Un ritual completo de belleza y bienestar pensado para regalar o regalarte estas fiestas.</p><ul><li>Tratamiento facial con DMAE o vitamina C.</li><li>Limpieza de cutis.</li><li>Masaje corporal + peeling + envoltura de chocolate blanco y cerezas.</li></ul><p class=\"promo-note\">Promoción de Navidad válida hasta el 31 de diciembre de 2026.</p>",
      "excerpt": "Facial con DMAE o vitamina C, limpieza de cutis y ritual corporal de chocolate blanco y cerezas.",
      "categories": [
        "Promociones de Navidad",
        "Facial y corporal"
      ],
      "image": "/assets/img/navidad/ritual-belleza-bienestar-beige.jpg",
      "variantOption": "",
      "variants": []
    },
    {
      "id": "hydradermie-plus-presoterapia",
      "handle": "hydradermie-plus-presoterapia",
      "name": "Hydradermie Plus + Presoterapia",
      "price": 112.0,
      "description": "<p>Combinación facial y corporal que reafirma, hidrata y drena.</p><ul><li>Hydradermie Plus: tratamiento facial para revitalizar e hidratar la piel.</li><li>Presoterapia: drenaje para unas piernas más ligeras.</li></ul><p class=\"promo-note\">Promoción de Navidad válida hasta el 31 de diciembre de 2026.</p>",
      "excerpt": "Reafirma, hidrata y drena. Sesión suelta o bono de 3 sesiones de presoterapia.",
      "categories": [
        "Promociones de Navidad",
        "Facial y corporal"
      ],
      "image": "/assets/img/navidad/hydradermie-plus-presoterapia-beige.jpg",
      "variantOption": "Opción",
      "variants": [
        {
          "name": "Sesión suelta",
          "price": 112.0,
          "sku": "LM-NAV26-HYDRA-PRESO-1S"
        },
        {
          "name": "Bono 3 sesiones de presoterapia",
          "price": 165.0,
          "sku": "LM-NAV26-PRESO-3S"
        }
      ]
    },
    {
      "id": "triple-limpieza",
      "handle": "triple-limpieza",
      "name": "Triple Limpieza",
      "price": 150.0,
      "description": "<p>Un pack de tres pasos para una piel limpia, oxigenada y renovada.</p><ul><li>Limpieza facial.</li><li>LC+ Carboxiterapia.</li><li>Detoxgyne.</li></ul><p class=\"promo-note\">Promoción de Navidad válida hasta el 31 de diciembre de 2026.</p>",
      "excerpt": "Limpieza facial, LC+ Carboxiterapia y Detoxgyne en un mismo pack.",
      "categories": [
        "Promociones de Navidad",
        "Tratamientos faciales"
      ],
      "image": "/assets/img/navidad/triple-limpieza-beige.jpg",
      "variantOption": "",
      "variants": []
    },
    {
      "id": "tratamiento-facial-caviar",
      "handle": "tratamiento-facial-caviar",
      "name": "Tratamiento facial de caviar",
      "price": 86.0,
      "description": "<p>Tratamiento facial de caviar que nutre, regenera y revitaliza la piel.</p><ul><li>Edición limitada: solo 6 packs disponibles.</li></ul><p class=\"promo-note\">Promoción de Navidad válida hasta el 31 de diciembre de 2026.</p>",
      "excerpt": "Nutre, regenera y revitaliza. Edición limitada: solo 6 packs.",
      "categories": [
        "Promociones de Navidad",
        "Tratamientos faciales"
      ],
      "image": "/assets/img/navidad/facial-caviar-beige.jpg",
      "variantOption": "",
      "variants": []
    },
    {
      "id": "dermapen-acido-hialuronico-nctf",
      "handle": "dermapen-acido-hialuronico-nctf",
      "name": "Dermapen con ácido hialurónico NCTF",
      "price": 152.5,
      "description": "<p>Tratamiento con Dermapen y ácido hialurónico NCTF.</p><ul><li>Sesión suelta: 152,50 €.</li><li>Bono 3 sesiones: 350 €.</li></ul><p class=\"promo-note\">Promoción de Navidad válida hasta el 31 de diciembre de 2026.</p>",
      "excerpt": "Dermapen con ácido hialurónico NCTF. Sesión suelta o bono de 3 sesiones.",
      "categories": [
        "Promociones de Navidad",
        "Tratamientos faciales"
      ],
      "image": "/assets/img/navidad/dermapen-nctf-beige.jpg",
      "variantOption": "Sesiones",
      "variants": [
        {
          "name": "Sesión suelta",
          "price": 152.5,
          "sku": "LM-NAV26-DERMAPEN-1S"
        },
        {
          "name": "Bono 3 sesiones",
          "price": 350.0,
          "sku": "LM-NAV26-DERMAPEN-3S"
        }
      ]
    },
    {
      "id": "lift-summum-guinot",
      "handle": "lift-summum-guinot",
      "name": "Lift Summum de Guinot",
      "price": 90.0,
      "description": "<p>Tratamiento facial de Guinot que reafirma, redefine y aporta firmeza.</p><ul><li>Sesión suelta: 90 €.</li><li>Bono 3 sesiones: 197,50 €.</li></ul><p class=\"promo-note\">Promoción de Navidad válida hasta el 31 de diciembre de 2026.</p>",
      "excerpt": "Reafirma, redefine y aporta firmeza. Sesión suelta o bono de 3 sesiones.",
      "categories": [
        "Promociones de Navidad",
        "Tratamientos faciales"
      ],
      "image": "/assets/img/navidad/lift-summum-guinot-beige.jpg",
      "variantOption": "Sesiones",
      "variants": [
        {
          "name": "Sesión suelta",
          "price": 90.0,
          "sku": "LM-NAV26-LIFT-SUMMUM-1S"
        },
        {
          "name": "Bono 3 sesiones",
          "price": 197.5,
          "sku": "LM-NAV26-LIFT-SUMMUM-3S"
        }
      ]
    },
    {
      "id": "hydra-summum-guinot",
      "handle": "hydra-summum-guinot",
      "name": "Hydra Summum de Guinot",
      "price": 90.0,
      "description": "<p>Tratamiento facial de Guinot para una hidratación profunda y una piel más luminosa.</p><ul><li>Sesión suelta: 90 €.</li><li>Bono 3 sesiones: 197,50 €.</li></ul><p class=\"promo-note\">Promoción de Navidad válida hasta el 31 de diciembre de 2026.</p>",
      "excerpt": "Hidratación profunda y luminosidad. Sesión suelta o bono de 3 sesiones.",
      "categories": [
        "Promociones de Navidad",
        "Tratamientos faciales"
      ],
      "image": "/assets/img/navidad/hydra-summum-guinot-beige.jpg",
      "variantOption": "Sesiones",
      "variants": [
        {
          "name": "Sesión suelta",
          "price": 90.0,
          "sku": "LM-NAV26-HYDRA-SUMMUM-1S"
        },
        {
          "name": "Bono 3 sesiones",
          "price": 197.5,
          "sku": "LM-NAV26-HYDRA-SUMMUM-3S"
        }
      ]
    },
    {
      "id": "hydradermie-ojos",
      "handle": "hydradermie-ojos",
      "name": "Hydradermie de ojos",
      "price": 51.0,
      "description": "<p>Tratamiento específico para el contorno de ojos que drena, descongestiona y rejuvenece.</p><ul><li>Sesión suelta: 51 €.</li><li>Bono 3 sesiones: 101,50 €.</li></ul><p class=\"promo-note\">Promoción de Navidad válida hasta el 31 de diciembre de 2026.</p>",
      "excerpt": "Drena, descongestiona y rejuvenece la mirada. Sesión suelta o bono de 3 sesiones.",
      "categories": [
        "Promociones de Navidad",
        "Tratamientos faciales"
      ],
      "image": "/assets/img/navidad/hydradermie-ojos-beige.jpg",
      "variantOption": "Sesiones",
      "variants": [
        {
          "name": "Sesión suelta",
          "price": 51.0,
          "sku": "LM-NAV26-HYDRA-OJOS-1S"
        },
        {
          "name": "Bono 3 sesiones",
          "price": 101.5,
          "sku": "LM-NAV26-HYDRA-OJOS-3S"
        }
      ]
    },
    {
      "id": "whow-shape-germaine",
      "handle": "whow-shape-germaine",
      "name": "Whow Shape de Germaine",
      "price": 362.5,
      "description": "<p>Tratamiento corporal que moldea, reafirma y reduce.</p><ul><li>Bono 5 sesiones: 362,50 €.</li><li>Bono 8 sesiones: 482,50 €.</li></ul><p class=\"promo-note\">Promoción de Navidad válida hasta el 31 de diciembre de 2026.</p>",
      "excerpt": "Moldea, reafirma y reduce. Bonos de 5 u 8 sesiones.",
      "categories": [
        "Promociones de Navidad",
        "Tratamientos corporales"
      ],
      "image": "/assets/img/navidad/whow-shape-germaine-beige.jpg",
      "variantOption": "Sesiones",
      "variants": [
        {
          "name": "Bono 5 sesiones",
          "price": 362.5,
          "sku": "LM-NAV26-WHOW-5S"
        },
        {
          "name": "Bono 8 sesiones",
          "price": 482.5,
          "sku": "LM-NAV26-WHOW-8S"
        }
      ]
    },
    {
      "id": "radiofrecuencia-facial",
      "handle": "radiofrecuencia-facial",
      "name": "Radiofrecuencia facial",
      "price": 107.5,
      "description": "<p>Radiofrecuencia facial que reafirma, estimula y rejuvenece la piel.</p><ul><li>Sesión suelta: 107,50 €.</li><li>Bono 3 sesiones: 197,50 €.</li></ul><p class=\"promo-note\">Promoción de Navidad válida hasta el 31 de diciembre de 2026.</p>",
      "excerpt": "Reafirma, estimula y rejuvenece. Sesión suelta o bono de 3 sesiones.",
      "categories": [
        "Promociones de Navidad",
        "Tratamientos faciales"
      ],
      "image": "/assets/img/navidad/radiofrecuencia-facial-beige.jpg",
      "variantOption": "Sesiones",
      "variants": [
        {
          "name": "Sesión suelta",
          "price": 107.5,
          "sku": "LM-NAV26-RADIO-1S"
        },
        {
          "name": "Bono 3 sesiones",
          "price": 197.5,
          "sku": "LM-NAV26-RADIO-3S"
        }
      ]
    },
    {
      "id": "depilacion-laser-navidad",
      "handle": "depilacion-laser-navidad",
      "name": "Depilación láser",
      "price": 102.5,
      "description": "<p>Depilación láser con bonos de 5 sesiones por zona. Piel lisa, siempre.</p><ul><li>Labio o mentón: 102,50 €.</li><li>Axilas: 152,50 €.</li><li>Ingles bikini: 152,50 €.</li><li>Ingles completas: 197,50 €.</li><li>Medias piernas: 392,50 €.</li><li>Piernas enteras: 480 €.</li></ul><p>Todo en bonos de 5 sesiones.</p><p class=\"promo-note\">Promoción de Navidad válida hasta el 31 de diciembre de 2026.</p>",
      "excerpt": "Piel lisa, siempre. Bonos de 5 sesiones por zona, desde 102,50 €.",
      "categories": [
        "Promociones de Navidad",
        "Depilación láser"
      ],
      "image": "/assets/img/navidad/depilacion-laser-beige.jpg",
      "variantOption": "Zona",
      "variants": [
        {
          "name": "Labio o mentón · 5 sesiones",
          "price": 102.5,
          "sku": "LM-NAV26-LASER-LABIO-5S"
        },
        {
          "name": "Axilas · 5 sesiones",
          "price": 152.5,
          "sku": "LM-NAV26-LASER-AXILAS-5S"
        },
        {
          "name": "Ingles bikini · 5 sesiones",
          "price": 152.5,
          "sku": "LM-NAV26-LASER-INGLBIK-5S"
        },
        {
          "name": "Ingles completas · 5 sesiones",
          "price": 197.5,
          "sku": "LM-NAV26-LASER-INGLCOM-5S"
        },
        {
          "name": "Medias piernas · 5 sesiones",
          "price": 392.5,
          "sku": "LM-NAV26-LASER-MEDPIER-5S"
        },
        {
          "name": "Piernas enteras · 5 sesiones",
          "price": 480.0,
          "sku": "LM-NAV26-LASER-PIERENT-5S"
        }
      ]
    }
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = CATALOG;
  else root.LOE_CATALOG = CATALOG;
})(typeof window !== 'undefined' ? window : globalThis);
