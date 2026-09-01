# TEDx Thyna — GitHub & Vercel

- [x] Vérifier l’authentification GitHub disponible dans la session — l’intégration est activée selon l’utilisateur.
- [x] Confirmer le nom du dépôt GitHub et son propriétaire — nouveau dépôt cible : `https://github.com/ziedaffes23/tedxthyna.git`.
- [x] Vérifier la présence et la validité des assets hébergés utilisés par le site — les assets utilisent les URLs Manus Storage du projet.
- [x] Préparer la configuration de build adaptée à Vercel sans exposer de secrets — `vercel.json` ajouté.
- [x] Pousser le projet vers GitHub — commit `6dbb50f16bc94ca64163d64aedb1aa784002699a` envoyé sur `main`.
- [x] Déployer sur Vercel — build statique téléversé depuis le Manus Computer et publié dans le projet `affesos/tedx-thyna`.
- [x] Rapporter les URLs GitHub et Vercel — https://github.com/ziedaffes23/tedxthyna et https://tedx-thyna.vercel.app/.

## Revision — visuels et navigation

- [ ] Auditer les références d’images actuellement utilisées par l’application et par Vercel.
- [ ] Restaurer les assets visuels utilisés en local avec des URLs compatibles Vercel.
- [ ] Transformer les sections principales en pages navigables via la barre supérieure.
- [ ] Tester chaque route, les images et la responsivité desktop/mobile.
- [ ] Repousser la révision sur GitHub et redéployer Vercel.

## Final content revision — event and agenda

- [x] Retirer Sirine Feki de la liste de l’organisation.
- [x] Remplacer le poste de Khadija par « Public Relations & Speaker Relations Specialist ».
- [x] Mettre la date de l’événement au 15 novembre 2026 et mettre à jour le compte à rebours.
- [x] Ajouter l’onglet Agenda et une page indiquant « TO BE ANNOUNCED SOON ».
- [x] Faire relier visuellement The Scene au board d’investigation par un fil.
- [x] Retirer les deux textes classifiés indiqués dans The Minds et The Organization.
- [x] Vérifier la page d’inscription et ses liens depuis la navigation.
- [x] Tester, pousser GitHub et redéployer le projet Vercel existant — déploiement final `4f1cfb2` Ready.

- [x] Ajouter une rewrite Vercel vers index.html afin que `/mission`, `/minds`, `/scene`, `/agenda`, `/organization` et `/register` fonctionnent en accès direct.
- [x] Recompiler, pousser la correction et vérifier le domaine de production.

## Reference-led homepage revision

- [x] Reproduire la composition de la homepage de référence : hero plein écran, image sombre du théâtre, titre TEDx THYNA, rail latéral et navigation supérieure.
- [x] Garder la homepage focalisée sur la mission et déplacer les détails secondaires vers les pages de navigation.
- [x] Vérifier les pages Mission, The Minds, The Scene, Agenda, Organization et Register.
- [x] Conserver Agenda avec « WILL BE ANNOUNCED SOON » et Registration comme page dédiée.
- [x] Tester la fidélité visuelle, les routes directes, les images et le responsive.
- [x] Pousser la refonte et redéployer Vercel — commit `3831cbe`, déploiement Ready.

## Investigation board restoration

- [x] Réintégrer « 03 / INVESTIGATION BOARD » directement sous le hero de la homepage.
- [x] Conserver le fil rouge reliant The Scene au board et les cinq indices.
- [x] Tester, pousser et redéployer la correction — commit `de60c39`, preview Vercel Ready.

## Board standalone page revision

- [ ] Retirer le board de la homepage et restaurer le hero seul.
- [ ] Ajouter une page autonome `/board` pour 03 / INVESTIGATION BOARD.
- [ ] Ajouter Board à la navigation desktop et mobile.
- [ ] Tester homepage, board, assets et routes directes.
- [ ] Pousser la correction et redéployer Vercel.
