import './App.css';
import { ProjectProvider } from './hooks/ProjectProvider';
import Header from './components/Header';
import Tools from './components/Tools';
import Canvas from './components/Canvas';
import Settings from './components/Settings';
import Extensions from './components/Extensions';

function App() {
  return (
    <ProjectProvider>
      <div className='app-grid'>
        <Header />
        <Tools />
        <Canvas />
        <Settings />
        <Extensions />
      </div>
    </ProjectProvider>
  );
}

export default App;