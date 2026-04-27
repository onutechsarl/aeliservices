export function DocumentationScreen() {
    return (
        <div className="relative z-10 h-[75vh] md:h-[80vh]">
            <iframe
                src="./aeli-service-guide-utilisation.pdf"
                style={{ width: "100%", height: "100%", backgroundColor: "#ffffff" }}
                frameBorder="0"
            />
        </div>
    )
}