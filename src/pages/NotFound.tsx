import { ButtonLink } from '../components/ui.tsx';

export function NotFound({ message }: { message?: string }) {
  return (
    <article className="page not-found">
      <h1>That page isn’t on the menu</h1>
      <p className="lede">{message ?? 'The address may be mistyped, or the page may have moved.'}</p>
      <div className="actions">
        <ButtonLink href="/base">See this week’s Base</ButtonLink>
        <ButtonLink href="/" variant="secondary">Go to the homepage</ButtonLink>
      </div>
    </article>
  );
}
