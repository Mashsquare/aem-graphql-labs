import { CountryBrowser, UrqlLabProvider } from "./CountryBrowser";

export default function Exercise() {
  return (
    <UrqlLabProvider>
      <CountryBrowser />
    </UrqlLabProvider>
  );
}
