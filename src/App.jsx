import { useState } from 'react'
import './App.css'
import Divider from './components/divider';
import { Upload } from 'lucide-react';

function Header() {
  return (
    <header>
      <h1>Unit 3</h1>

      <Divider />

      <input type='text' placeholder='Project name'></input>

      <Divider />

      <Upload />
    </header>
  );
}

function Tools() {
  return (
    <section>
      tools
    </section>
  );
}

function Canvas() {
  return (
    <main>
      canvas
    </main>
  );
}

function Settings() {
  return (
    <aside>
      settings
    </aside>
  );
}

function Extensions() {
  return (
    <aside>
      extensions
    </aside>
  );
}

function App() {
  const [settings, setSettings] = useState(false);
  const [extensions, setExtensions] = useState(false);

  return (
    <>
      <Header />
      <Tools />
      <Canvas />
      {settings && <Settings />}
      {extensions && <Extensions />}
    </>
  );
}

export default App;
