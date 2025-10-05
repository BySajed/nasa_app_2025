const Avatar = ({ username }: { username?: string | null }) => {
  return (
    <div className="avatar size-16">
      <div className="ring-secondary ring-offset-base-100 w-24 rounded-full ring-2 ring-offset-2">
        {username ? (
          <img
            src={`https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=${username}`}
          />
        ) : (
          <img src="https://st3.depositphotos.com/9998432/13335/v/450/depositphotos_133352010-stock-illustration-default-placeholder-man-and-woman.jpg" />
        )}
      </div>
    </div>
  );
};

export default Avatar;
