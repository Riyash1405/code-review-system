const Login = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="p-8 bg-white rounded shadow-lg w-96 text-center">
        <h1 className="text-2xl font-bold mb-4">Code Review System</h1>
        <p className="mb-6 text-gray-600">Login with GitHub to continue</p>
        <button className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-800 transition">
          Login with GitHub
        </button>
      </div>
    </div>
  );
};

export default Login;