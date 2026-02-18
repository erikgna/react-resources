import { useState } from "react";
import { Child } from "./Child";

export function Parent() {
    const [name, setName] = useState<string>("John");

    const handleNameChange = (newName: string) => {
        setName(newName);
    };

    return <Child name={name} onNameChange={handleNameChange} />;
}
