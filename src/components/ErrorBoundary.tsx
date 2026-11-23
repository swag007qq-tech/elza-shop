import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false, message: ''};
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {hasError: true, message: error.message || 'Произошла ошибка приложения'};
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="elza-wallpaper min-h-screen w-full flex items-center justify-center p-4">
          <div className="elza-card-shadow max-w-[480px] w-full bg-[#FCF3EF] border-2 border-[#9E6B56] rounded-[30px] p-7 text-center">
            <h1 className="text-[22px] font-extrabold text-[#6B4E45] mb-2">
              Что-то пошло не так
            </h1>
            <p className="text-[14.5px] font-semibold text-[#8A6D64] mb-5 break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="elza-buy-btn px-7 h-[48px] rounded-full text-white font-bold text-[16px] cursor-pointer"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
