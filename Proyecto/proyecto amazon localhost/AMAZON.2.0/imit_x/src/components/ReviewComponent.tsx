import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonTextarea,
  IonList,
  IonAvatar,
  IonText,
  IonAlert,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonSpinner
} from '@ionic/react';
import { star, starOutline, send, close } from 'ionicons/icons';

interface Review {
  id: string;
  client_id: string;
  client_name: string;
  product_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewComponentProps {
  productId: string;
  productName?: string;
}

const ReviewComponent: React.FC<ReviewComponentProps> = ({ productId, productName }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [canReview, setCanReview] = useState(true);

  useEffect(() => {
    loadReviews();
    checkIfCanReview();
  }, [productId]);

  const loadReviews = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/reviews/${productId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Error cargando reseñas:', err);
    }
  };

  const checkIfCanReview = async () => {
    try {
      const clientId = localStorage.getItem('client_id');
      if (!clientId) {
        setCanReview(false);
        return;
      }

      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/reviews/can-review/${productId}/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setCanReview(data.canReview);
      }
    } catch (err) {
      console.error('Error verificando si puede dejar reseña:', err);
    }
  };

  const handleSubmitReview = async () => {
    if (newRating === 0) {
      setAlertMessage('Por favor selecciona una calificación');
      setShowAlert(true);
      return;
    }

    if (newComment.trim().length < 10) {
      setAlertMessage('La reseña debe tener al menos 10 caracteres');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      const clientId = localStorage.getItem('client_id');
      const clientName = localStorage.getItem('client_name') || 'Usuario';

      if (!clientId) {
        setAlertMessage('Debes iniciar sesión para dejar una reseña');
        setShowAlert(true);
        return;
      }

      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_name: clientName,
          product_id: productId,
          rating: newRating,
          comment: newComment.trim()
        })
      });

      if (!res.ok) {
        throw new Error('Error al enviar reseña');
      }

      // Recargar reseñas
      await loadReviews();
      
      // Limpiar formulario y cerrar modal
      setNewRating(0);
      setNewComment('');
      setShowReviewModal(false);
      setAlertMessage('¡Reseña publicada exitosamente!');
      setShowAlert(true);
      setCanReview(false);
    } catch (err) {
      console.error('Error enviando reseña:', err);
      setAlertMessage('Error al enviar la reseña. Intenta nuevamente.');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const renderStars = (rating: number, interactive = false, onHover?: (rating: number) => void, onClick?: (rating: number) => void) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <IonIcon
            key={star}
            icon={star <= (interactive ? (hoveredRating || rating) : rating) ? starIcon : starOutline}
            style={{
              fontSize: interactive ? '32px' : '20px',
              color: star <= (interactive ? (hoveredRating || rating) : rating) ? '#FFB800' : '#ccc',
              cursor: interactive ? 'pointer' : 'default',
              transition: 'all 0.2s'
            }}
            onMouseEnter={() => interactive && onHover && onHover(star)}
            onMouseLeave={() => interactive && onHover && onHover(0)}
            onClick={() => interactive && onClick && onClick(star)}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const starIcon = star;

  return (
    <>
      <IonCard>
        <IonCardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <IonCardTitle>Reseñas y Calificaciones</IonCardTitle>
            {canReview && (
              <IonButton size="small" onClick={() => setShowReviewModal(true)}>
                <IonIcon icon={send} slot="start" />
                Escribir Reseña
              </IonButton>
            )}
          </div>
        </IonCardHeader>

        <IonCardContent>
          {/* Resumen de calificación */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px', 
            padding: '20px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#FFB800' }}>
                {calculateAverageRating()}
              </div>
              {renderStars(Math.round(Number(calculateAverageRating())))}
              <div style={{ marginTop: '8px', color: '#666' }}>
                {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = reviews.filter(r => r.rating === rating).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                
                return (
                  <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ width: '70px', fontSize: '14px' }}>
                      {rating} <IonIcon icon={starIcon} style={{ fontSize: '12px', color: '#FFB800' }} />
                    </span>
                    <div style={{ 
                      flex: 1, 
                      height: '8px', 
                      background: '#e0e0e0', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        background: '#FFB800',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <span style={{ width: '40px', fontSize: '14px', color: '#666' }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lista de reseñas */}
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <p>Aún no hay reseñas para este producto</p>
              {canReview && (
                <IonButton fill="outline" onClick={() => setShowReviewModal(true)}>
                  Sé el primero en opinar
                </IonButton>
              )}
            </div>
          ) : (
            <IonList>
              {reviews.map((review) => (
                <IonCard key={review.id} style={{ marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <IonCardContent>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <IonAvatar style={{ width: '40px', height: '40px' }}>
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(review.client_name)}&background=random`} 
                          alt={review.client_name} 
                        />
                      </IonAvatar>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <IonText>
                            <strong>{review.client_name}</strong>
                          </IonText>
                          {renderStars(review.rating)}
                        </div>
                        <IonText color="medium" style={{ fontSize: '12px' }}>
                          {formatDate(review.created_at)}
                        </IonText>
                      </div>
                    </div>
                    <IonText>
                      <p style={{ margin: 0, lineHeight: '1.6' }}>{review.comment}</p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              ))}
            </IonList>
          )}
        </IonCardContent>
      </IonCard>

      {/* Modal para escribir reseña */}
      <IonModal isOpen={showReviewModal} onDidDismiss={() => setShowReviewModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Escribir Reseña</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowReviewModal(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding">
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {productName && (
              <IonText>
                <h3 style={{ marginBottom: '20px' }}>{productName}</h3>
              </IonText>
            )}

            <IonItem lines="none" style={{ marginBottom: '20px' }}>
              <IonLabel position="stacked" style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                Tu Calificación
              </IonLabel>
              <div style={{ padding: '10px 0' }}>
                {renderStars(
                  newRating, 
                  true, 
                  setHoveredRating,
                  setNewRating
                )}
              </div>
            </IonItem>

            <IonItem lines="none">
              <IonLabel position="stacked" style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                Tu Reseña
              </IonLabel>
              <IonTextarea
                value={newComment}
                onIonInput={(e) => setNewComment(e.detail.value || '')}
                placeholder="Comparte tu experiencia con este producto..."
                rows={6}
                style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px',
                  marginTop: '8px'
                }}
              />
            </IonItem>

            <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
              <p>Mínimo 10 caracteres. {newComment.length}/500</p>
            </div>

            <div style={{ marginTop: '30px', display: 'flex', gap: '12px' }}>
              <IonButton 
                expand="block" 
                onClick={handleSubmitReview}
                disabled={loading || newRating === 0 || newComment.trim().length < 10}
                style={{ flex: 1 }}
              >
                {loading ? (
                  <>
                    <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                    Publicando...
                  </>
                ) : (
                  <>
                    <IonIcon icon={send} slot="start" />
                    Publicar Reseña
                  </>
                )}
              </IonButton>
              <IonButton 
                expand="block" 
                fill="outline" 
                color="medium"
                onClick={() => setShowReviewModal(false)}
                style={{ flex: 1 }}
              >
                Cancelar
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonModal>

      {/* Alert */}
      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        message={alertMessage}
        buttons={['OK']}
      />
    </>
  );
};

export default ReviewComponent;
