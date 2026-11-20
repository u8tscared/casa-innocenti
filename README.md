# Casa Innocenti

Maquette de site pour Casa Innocenti, épicerie fine italienne (30 Grande Rue, Saint-Priest).

- Site en ligne : https://u8tscared.github.io/casa-innocenti/
- Version « Notte » (plus spectaculaire, ambiance nuit) : https://u8tscared.github.io/casa-innocenti/notte/ (`notte/index.html`).
- `index.html` : le site complet en un seul fichier (accueil, boutique, à emporter, anti-gaspi, La Casa, panier et paiement de démonstration).
- `src/` : les sources (pages, styles, scripts, illustrations) et `build.py` qui les assemble.

La boutique est reliée à Growth Gusto (établissement « Casa Innocenti », `src/da/gg.js`) : les produits, photos, prix, rayons et le stock viennent de l'app (Boutique), les commandes arrivent dans Growth Gusto « à valider », paiement au retrait. Un produit scanné et mis en ligne dans l'app apparaît ici tout seul.
La page « À emporter » montre les rayons prêts à manger de l'app (Plats du midi, arancini…) et envoie la commande de la même façon.
Encore en démonstration sur le site : les textes d'accueil et les cartes anti-gaspi d'exemple (masquées dès que la boutique est chargée).
`?gg=off` dans l'adresse revient à la maquette sans Growth Gusto.
Thème Noël : un interrupteur dans l'en-tête active ou retire l'habillage de fêtes (guirlande, neige, vitrine de Noël). Le choix est gardé sur l'appareil.
