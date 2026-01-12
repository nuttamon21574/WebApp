export default function SaveButton({ isComplete = true, onClick }) {
  return (
    <button
      type="submit"
      onClick={onClick}
      style={{
        backgroundColor: isComplete ? '#DCCEFF' : '#E9E1FF',
        color: 'black',
      }}
      className={`
        px-12 py-4 rounded-full font-medium transition-all duration-200
        ${isComplete ? 'hover:bg-white cursor-pointer' : 'opacity-60 pointer-events-none'}
      `}
    >
      Save
    </button>
  );
}
