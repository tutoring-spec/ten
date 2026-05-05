# Istruzioni di integrazione routing

Aggiungi le seguenti due route nel tuo `App.jsx` (o dove gestisci il router):

```jsx
import CoachAuth from './pages/CoachAuth';

// route pubblica — login e registrazione allenatori
{ path: '/accesso', element: <CoachAuth /> }

// oppure se usi react-router-dom:
<Route path="/accesso" element={<CoachAuth />} />
```

La route `/accesso` deve essere **pubblica** (senza autenticazione admin richiesta).

La route `/corso` (dove gli allenatori vedono i contenuti) deve usare
il hook `useCoachAuth` per proteggere l'accesso:

```jsx
import { useCoachAuth } from '@/hooks/useCoachAuth';

export default function Corso() {
  const { loading, coach } = useCoachAuth();

  if (loading) return <div>Caricamento...</div>;
  if (!coach)  { window.location.href = '/accesso'; return null; }

  return <div>/* contenuto del corso */</div>;
}
```
