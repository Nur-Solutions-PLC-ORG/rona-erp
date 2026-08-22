import Logo from "./logo";

const LoaderPage = () => {
  return (
    <div className="flex flex-1 w-full h-full items-center justify-center">
      <Logo black className="animate-pulse opacity-5" />
    </div>
  );
};

export default LoaderPage;
