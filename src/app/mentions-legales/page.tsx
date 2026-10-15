import type { Metadata } from "next";
import LegalShell from "@/components/LegalShell";
import { LABEL } from "@/components/ui";
import { SETTINGS_KEY } from "@/lib/settings";
import { STORAGE_KEY } from "@/lib/types";

export const metadata: Metadata = {
  description: "Éditeur, hébergeur, limites de l'outil et données personnelles.",
};

const CONTACT = "contact.azlobaki@pm.me";

const SECTION_TITLE = `${LABEL} border-b border-rule pb-1`;
const PARAGRAPH = "mt-2 max-w-prose";
const SECTION = "mt-10";
const DATA = "font-mono text-[0.8125rem] [overflow-wrap:anywhere]";

export default function LegalNotice() {
  return (
    <LegalShell>
      <main className="w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          <span data-locale="fr">Mentions légales et confidentialité</span>
          <span data-locale="en">Legal notice and privacy</span>
        </h1>

        <article lang="fr" data-locale="fr">
          <section className={SECTION} aria-labelledby="editeur">
            <h2 id="editeur" className={SECTION_TITLE}>
              Éditeur
            </h2>
            <p className={PARAGRAPH}>
              Ce site est édité par un particulier, à titre non professionnel, qui a choisi de rester anonyme comme le
              permet l&apos;article 6, III, 2 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
              l&apos;économie numérique. Ses éléments d&apos;identification ont été communiqués à l&apos;hébergeur.
            </p>
            <p className={PARAGRAPH}>
              Contact : <span className={DATA}>{CONTACT}</span>
            </p>
          </section>

          <section className={SECTION} aria-labelledby="hebergeur">
            <h2 id="hebergeur" className={SECTION_TITLE}>
              Hébergeur
            </h2>
            <address className={`${PARAGRAPH} not-italic`}>
              Vercel Inc.
              <br />
              440 N Barranca Avenue #4133
              <br />
              Covina, CA 91723, États-Unis
              <br />
              Téléphone : +1 951-383-6898
              <br />
              <span className={DATA}>https://vercel.com</span>
            </address>
          </section>

          <section className={SECTION} aria-labelledby="avertissement">
            <h2 id="avertissement" className={SECTION_TITLE}>
              Avertissement — limites de l&apos;outil
            </h2>
            <p className={PARAGRAPH}>
              Innomi remplace dans un texte les chaînes que vous lui indiquez, et uniquement celles-là. Il ne détecte
              aucune donnée sensible par lui-même : un nom, une adresse ou un identifiant absent de vos règles, mal
              orthographié, coupé par un retour à la ligne ou écrit autrement reste tel quel dans le résultat.
            </p>
            <p className={PARAGRAPH}>
              Un texte passé dans Innomi n&apos;est donc pas pour autant anonymisé au sens du RGPD : des informations
              restantes peuvent encore permettre de réidentifier une personne. Relisez toujours le résultat avant de le
              partager. L&apos;outil ne remplace ni votre propre vérification ni les procédures de protection des
              données de votre organisation, et les décisions prises au vu de son résultat relèvent de la seule
              responsabilité de l&apos;utilisateur.
            </p>
            <p className={PARAGRAPH}>
              Le logiciel est fourni « en l&apos;état », sans garantie d&apos;aucune sorte, conformément à sa licence
              (GNU AGPL v3, articles 15 et 16). Dans les limites permises par la loi, l&apos;éditeur ne saurait être
              tenu responsable des dommages résultant de son utilisation.
            </p>
          </section>

          <section className={SECTION} aria-labelledby="donnees">
            <h2 id="donnees" className={SECTION_TITLE}>
              Données personnelles
            </h2>
            <p className={PARAGRAPH}>
              <strong>Textes traités.</strong> Le remplacement a lieu entièrement dans votre navigateur. Le texte que
              vous collez et son résultat ne sont envoyés à aucun serveur et ne sont pas conservés : ils disparaissent
              au rechargement ou à la fermeture de la page. Une politique de sécurité du contenu interdit au navigateur
              toute connexion réseau depuis la page.
            </p>
            <p className={PARAGRAPH}>
              <strong>Stockage local.</strong> Deux clés peuvent exister dans le stockage local de votre navigateur, et
              nulle part ailleurs. <span className={DATA}>{STORAGE_KEY}</span> contient les modèles de règles que vous
              avez enregistrés ; <span className={DATA}>{SETTINGS_KEY}</span> contient uniquement la langue de
              l&apos;interface, écrite seulement si vous utilisez le sélecteur FR | EN. Aucun texte n&apos;est jamais
              stocké, et rien n&apos;est écrit tant que vous n&apos;enregistrez pas de modèle ni n&apos;utilisez le sélecteur FR | EN.
              Attention : le « texte à rechercher » d&apos;une règle est souvent la donnée sensible elle-même ; toute
              personne ayant accès à ce navigateur peut la lire. Vous pouvez supprimer un modèle depuis l&apos;application,
              ou tous en effaçant les données du site dans votre navigateur. Le site ne dépose aucun cookie et
              n&apos;utilise aucune mesure d&apos;audience ni aucun traceur publicitaire.
            </p>
            <p className={PARAGRAPH}>
              <strong>Journaux d&apos;hébergement.</strong> Comme tout hébergeur, Vercel enregistre les requêtes reçues
              (adresse IP, date, page demandée, navigateur) pour assurer le fonctionnement et la sécurité du service.
              Ces données sont traitées par Vercel Inc., dont les serveurs peuvent se trouver hors de l&apos;Union
              européenne ; Vercel adhère au cadre de protection des données UE–États-Unis (Data Privacy Framework).
              L&apos;éditeur n&apos;exploite pas ces journaux. Ils ne contiennent jamais le texte que vous traitez.
            </p>
            <p className={PARAGRAPH}>
              <strong>Vos droits.</strong> Vous pouvez exercer vos droits d&apos;accès, de rectification,
              d&apos;effacement, de limitation et d&apos;opposition en écrivant à{" "}
              <span className={DATA}>{CONTACT}</span>, et introduire une réclamation auprès de la CNIL (cnil.fr).
            </p>
          </section>

          <section className={SECTION} aria-labelledby="source">
            <h2 id="source" className={SECTION_TITLE}>
              Code source
            </h2>
            <p className={PARAGRAPH}>
              Logiciel libre sous licence GNU Affero General Public License v3 :{" "}
              <span className={DATA}>https://github.com/azlobaki/innomi</span>
            </p>
          </section>
        </article>

        <article lang="en" data-locale="en">
          <p className={`${PARAGRAPH} mt-6 italic`}>
            This translation is provided for convenience; the French text is the legally binding one.
          </p>

          <section className={SECTION} aria-labelledby="publisher">
            <h2 id="publisher" className={SECTION_TITLE}>
              Publisher
            </h2>
            <p className={PARAGRAPH}>
              This site is published by an individual, on a non-professional basis, who has chosen to remain anonymous as
              permitted by article 6, III, 2 of law no. 2004-575 of 21 June 2004 on confidence in the digital economy.
              Their identification details have been provided to the host.
            </p>
            <p className={PARAGRAPH}>
              Contact: <span className={DATA}>{CONTACT}</span>
            </p>
          </section>

          <section className={SECTION} aria-labelledby="host">
            <h2 id="host" className={SECTION_TITLE}>
              Host
            </h2>
            <address className={`${PARAGRAPH} not-italic`}>
              Vercel Inc.
              <br />
              440 N Barranca Avenue #4133
              <br />
              Covina, CA 91723, United States
              <br />
              Telephone: +1 951-383-6898
              <br />
              <span className={DATA}>https://vercel.com</span>
            </address>
          </section>

          <section className={SECTION} aria-labelledby="disclaimer">
            <h2 id="disclaimer" className={SECTION_TITLE}>
              Disclaimer — limits of the tool
            </h2>
            <p className={PARAGRAPH}>
              Innomi replaces in a text the strings you give it, and only those. It detects no sensitive data by itself: a
              name, an address or an identifier that is missing from your rules, misspelled, split by a line break or
              written differently stays as it is in the result.
            </p>
            <p className={PARAGRAPH}>
              A text run through Innomi is therefore not anonymised within the meaning of the GDPR: remaining information
              may still allow a person to be re-identified. Always read the result before sharing it. The tool replaces
              neither your own checking nor your organisation&apos;s data protection procedures, and decisions taken on
              the strength of its result are the user&apos;s sole responsibility.
            </p>
            <p className={PARAGRAPH}>
              The software is provided &ldquo;as is&rdquo;, without warranty of any kind, in accordance with its licence
              (GNU AGPL v3, articles 15 and 16). To the extent permitted by law, the publisher cannot be held liable for
              damage resulting from its use.
            </p>
          </section>

          <section className={SECTION} aria-labelledby="personal-data">
            <h2 id="personal-data" className={SECTION_TITLE}>
              Personal data
            </h2>
            <p className={PARAGRAPH}>
              <strong>Texts processed.</strong> The replacement takes place entirely in your browser. The text you paste
              and its result are sent to no server and are not kept: they disappear when the page is reloaded or closed. A
              content security policy forbids the browser any network connection from the page.
            </p>
            <p className={PARAGRAPH}>
              <strong>Local storage.</strong> Two keys may exist in your browser&apos;s local storage, and nowhere else.{" "}
              <span className={DATA}>{STORAGE_KEY}</span> holds the rule templates you have saved;{" "}
              <span className={DATA}>{SETTINGS_KEY}</span> holds only the interface language, written only if you use the
              FR | EN switch. No text is ever stored, and nothing is written until you save a template or use the
              FR | EN switch. Be careful: the &ldquo;text to find&rdquo; of a rule is often the sensitive data itself; anyone
              with access to this browser can read it. You can delete a template from the application, or all of them by
              clearing the site&apos;s data in your browser. The site sets no cookies and uses no audience measurement or
              advertising trackers.
            </p>
            <p className={PARAGRAPH}>
              <strong>Hosting logs.</strong> Like any host, Vercel records the requests it receives (IP address, date,
              page requested, browser) to keep the service running and secure. This data is processed by Vercel Inc.,
              whose servers may be located outside the European Union; Vercel adheres to the EU–US Data Privacy
              Framework. The publisher does not use these logs. They never contain the text you process.
            </p>
            <p className={PARAGRAPH}>
              <strong>Your rights.</strong> You may exercise your rights of access, rectification, erasure, restriction
              and objection by writing to <span className={DATA}>{CONTACT}</span>, and lodge a complaint with the CNIL
              (cnil.fr).
            </p>
          </section>

          <section className={SECTION} aria-labelledby="source-code">
            <h2 id="source-code" className={SECTION_TITLE}>
              Source code
            </h2>
            <p className={PARAGRAPH}>
              Free software under the GNU Affero General Public License v3:{" "}
              <span className={DATA}>https://github.com/azlobaki/innomi</span>
            </p>
          </section>
        </article>
      </main>
    </LegalShell>
  );
}
