import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    backgroundColor: '#f5f5f5',
                    flexDirection: 'column',
                    gap: '20px',
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        maxWidth: '600px',
                        textAlign: 'center'
                    }}>
                        <h1 style={{ color: '#d32f2f', marginBottom: '20px' }}>
                            Ops! Algo deu errado
                        </h1>
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            Ocorreu um erro inesperado na aplicação.
                        </p>
                        {this.state.error && (
                            <details style={{
                                marginBottom: '20px',
                                textAlign: 'left',
                                backgroundColor: '#f5f5f5',
                                padding: '15px',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}>
                                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                                    Detalhes do erro
                                </summary>
                                <pre style={{
                                    marginTop: '10px',
                                    overflow: 'auto',
                                    fontSize: '12px',
                                    color: '#d32f2f'
                                }}>
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={this.handleReload}
                            style={{
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
