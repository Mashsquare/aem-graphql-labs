import { CountryBrowser, UrqlLabProvider } from "./CountryBrowser";

export default function Solution() {
  return (
    <UrqlLabProvider>
      <CountryBrowser />
    </UrqlLabProvider>
  );
}
