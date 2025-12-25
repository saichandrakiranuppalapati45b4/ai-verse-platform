import './Loader.css';

const Loader = ({ size = 'md', text }) => {
    const sizeClass = {
        sm: 'loader-sm',
        md: 'loader-md',
        lg: 'loader-lg'
    }[size];

    return (
        <div className="loader-container">
            <div className={`loader ${sizeClass}`}>
                <div className="loader-circle"></div>
                <div className="loader-circle"></div>
                <div className="loader-circle"></div>
            </div>
            {text && <p className="loader-text">{text}</p>}
        </div>
    );
};

export default Loader;
