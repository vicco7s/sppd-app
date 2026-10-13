const whatsappNumber = "6282149631510";

export default function WarningPage() {
	return (
		<main
			style={{
				alignItems: "center",
				background: "#cacaca",
				boxSizing: "border-box",
				color: "#1f2937",
				display: "flex",
				fontFamily: "Arial, sans-serif",
				justifyContent: "center",
				minHeight: "100vh",
				padding: "32px 20px",
				textAlign: "center",
				width: "100%",
			}}
		>
			<section style={{ maxWidth: 800 }} aria-labelledby="warning-title">
				<div aria-hidden="true" style={{ fontSize: 62, marginBottom: 12 }}>
					⚠️
				</div>
				<h1
					id="warning-title"
					style={{
						color: "#b91c1c",
						fontSize: "clamp(40px, 9vw, 56px)",
						fontWeight: 600,
						margin: "0 0 24px",
					}}
				>
					Mohon Maaf, Akses Ditutup
				</h1>
				<p
					style={{
						fontSize: "clamp(22px, 4vw, 25px)",
						fontWeight: 700,
						lineHeight: 1.5,
						margin: "0 0 36px",
					}}
				>
					Aplikasi ini belum dapat digunakan saat ini. Jika Anda masih membutuhkannya, silakan hubungi yang bersangkutan melalui tombol WhatsApp Hijau di bawah ini. Bila tidak ada, aplikasi akan nonaktifkan secara otomatis.
				</p>
				<p style={{color:"#261cb9",fontSize: "clamp(22px, 4vw, 25px)",
						fontWeight: 700,
						lineHeight: 1.5,
						margin: "0 0 36px",}}>Last Update 13 Oktober 2026 - Retired</p>
				<p></p>
				<a
					href={`https://wa.me/${whatsappNumber}`}
					style={{
						background: "#16a34a",
						borderRadius: 12,
						color: "white",
						display: "inline-block",
						fontSize: 22,
						fontWeight: 800,
						padding: "18px 32px",
						textDecoration: "none",
					}}
				>
					Hubungi via Chat
				</a>
			</section>
		</main>
	);
}