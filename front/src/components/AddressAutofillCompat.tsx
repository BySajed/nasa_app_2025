// src/components/AddressAutofillCompat.tsx
import * as React from "react";
import {
    AddressAutofill as Raw,
} from "@mapbox/search-js-react";
import type {AddressAutofillProps} from "@mapbox/search-js-react/dist/components/AddressAutofill";

type Props = React.PropsWithChildren<AddressAutofillProps>;

// Pas de <never>, on accepte les props objet + children.
// On passe par createElement pour “apaiser” TS19 vs types React18.
export default function AddressAutofillCompat(props: Props) {
    return React.createElement(
        Raw as unknown as React.ComponentType<Record<string, unknown>>,
        props as unknown as Record<string, unknown>,
        props.children
    );
}
