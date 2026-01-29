import { Link } from "react-router-dom"

function Home() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Home</h1>
            <div className="flex flex-col gap-2">
                <Link className="text-blue-500 p-4" to="/state-playground">State Playground</Link>
                <Link className="text-blue-500 p-4" to="/responsive-playground">Responsive Playground</Link>
                <Link className="text-blue-500 p-4" to="/dark-mode-playground">Dark Mode Playground</Link>
                <Link className="text-blue-500 p-4" to="/theme-playground">Theme Playground</Link>
                <Link className="text-blue-500 p-4" to="/custom-utility-playground">Custom Utility Playground</Link>
                <Link className="text-blue-500 p-4" to="/detection-playground">Detection Playground</Link>
                <Link className="text-blue-500 p-4" to="/directives-playground">Directives Playground</Link>
            </div>
        </div>
    )
}

export default Home