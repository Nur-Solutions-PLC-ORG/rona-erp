import Logo from "./logo";

const LoaderPage = () => {
  return (
    <div className="flex flex-1 w-full h-full items-center justify-center">
      <Logo variant="mark" className="size-14 animate-pulse" />
    </div>
  );
};

export default LoaderPage;
