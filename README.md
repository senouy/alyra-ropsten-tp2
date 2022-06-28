# TP2 - Tests unitaires
## _Système de vote_

[![N|Solid](https://alyra.fr/wp-content/uploads/2019/06/logo-titre-alyra-bleu-transparent-64px_v3.png)](https://github.com/senouy/alyra-ropsten-tp2)

## Installation

Cloner le projet depuis le repository public https://github.com/senouy/alyra-ropsten-tp2

Lancer ganache depuis votre terminal
```sh
ganache
```

Installer les dependances du projet puis lancer les testsr.

```sh
cd alyra-ropsten-tp2
npm i
npm install @openzeppelin/test-helpers @openzeppelin/contracts @truffle/hdwallet-provider dotenv
npm install --save-dev eth-gas-reporter
truffle test
```

## Couverture de test

### 1. Tests sur l'étape _Add Voter_

- Scénarios testés
    - Ajout de plusieurs votants
    - Récupération d'un votant
    - Vérifier que le nouveau votant n'a pas déjà voté (hasVoted==false)
- Requires testés
    - ajout d'un votant par une adresse autre que le owner
    - ajout d'un votant déjà enregistré
    - ajout d'un votant durant une phase autre que la phase "ajout des votants"
- Event testé
    - ajout d'un votant

### 2. Tests sur l'étape _Add Proposal_

- Scénarios testés
    - Ajout d'une proposition
    - Vérifier que la nouvelle proposition à son compteur à 0
- Requires testés
    - ajout d'une proposition par une adresse autre qu'un votant
    - ajout d'un votant durant une phase autre que la phase "ajout des propositions"
    - ajout d'une proposition vide
- Event testé
    - ajout d'une proposition

### 3. Tests sur l'étape _Vote_

- Scénarios testés
    - Vérifier l'incrémentation du compteur de la proposition
    - Vérifier que le votant est tagué comme ayant voté
    - Vérifier que le votant est rattaché à l'identifiant de la proposition votée
- Requires testés
    - vote par une adresse autre qu'un votant
    - vote durant une phase autre que la phase "vote"
    - voter une seconde fois
    - vote pour une proposition inconnue
- Event testé
    - ajout d'un vote

### 4. Tests sur l'étape _Tally Votes_

- Scénarios testés
    - Vérifier la bonne proposition gagnante
    - Vérifier que le status est bien modifié à _VotesTallied_
- Requires testés
    - décompte par une adresse autre que le owner
    - décompte durant une phase autre que la phase "décompte"
- Event testé
    - Changement du workflow status

### 4. Tests sur les changements d'étape

- Event testé
    - Changement du workflow status sur le commencement de la phase d'ajout de proposition
    - Changement du workflow status sur la fin de la phase d'ajout de proposition
    - Changement du workflow status sur le commencement de la phase de vote
    - Changement du workflow status sur la fin de la phase de vote
	
## Rapport d'utilisation du gaz

![alt text](https://github.com/senouy/alyra-ropsten-tp2/img-gas-reporter.jpg?raw=true)

## License

MIT
